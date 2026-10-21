import asyncHandler from "express-async-handler";
import { ExpenseRoom, RoomJoinRequest } from "../models/room.js";
import Expense from "../models/expense.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

// @desc    Create an expense room
// @route   POST /api/rooms
// @access  Private
const createExpenseRoom = asyncHandler(async (req, res) => {
  const { title, description, allowMembersToAddExpense } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error("Please provide title and description for the room.");
  }

  const room = await ExpenseRoom.create({
    title,
    description,
    creator: req.user._id,
    members: [req.user._id], // Creator is automatically the first member
    allowMembersToAddExpense: allowMembersToAddExpense !== undefined ? allowMembersToAddExpense : true,
  });

  res.status(201).json({
    success: true,
    room,
  });
});

// @desc    Send a room join request to a user (Members cannot be added directly)
// @route   POST /api/rooms/:id/invite
// @access  Private
const inviteUserToRoom = asyncHandler(async (req, res) => {
  const { userEmail, notificationMessage } = req.body;
  const roomId = req.params.id;

  if (!userEmail) {
    res.status(400);
    throw new Error("Please provide a user email to invite.");
  }

  const room = await ExpenseRoom.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error("Expense room not found.");
  }

  // Verify requester is creator or an existing member
  const isAuthorized = room.creator.toString() === req.user._id.toString() ||
    room.members.some((m) => m.toString() === req.user._id.toString());

  if (!isAuthorized) {
    res.status(403);
    throw new Error("Only the creator or existing members can invite new users.");
  }

  // Find the user by exact email match
  const targetUser = await User.findOne({ email: userEmail.toLowerCase().trim() });
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found.");
  }

  const userId = targetUser._id;

  // Prevent inviting yourself
  if (userId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot invite yourself to the room.");
  }

  // Check if user is already a member or creator
  const isAlreadyMember = room.creator.toString() === userId.toString() ||
    room.members.some((m) => m.toString() === userId.toString());

  if (isAlreadyMember) {
    res.status(400);
    throw new Error("User is already a member of this expense room.");
  }

  // Check if a pending invite already exists
  const existingRequest = await RoomJoinRequest.findOne({
    room: roomId,
    user: userId,
    status: "pending",
  });

  if (existingRequest) {
    res.status(400);
    throw new Error("A pending join request already exists for this user.");
  }

  const joinRequest = await RoomJoinRequest.create({
    room: roomId,
    user: userId,
    notificationMessage: notificationMessage || `You have been invited to join the expense room: ${room.title}`,
    status: "pending",
  });

  // Automatically trigger a persistent notification for the invited user
  await Notification.create({
    user: userId,
    title: "Expense Room Invitation",
    message: notificationMessage || `You have been invited to join the room: ${room.title}`,
    type: "room_invite",
    relatedRoom: roomId,
  });

  res.status(201).json({
    success: true,
    message: "Join request sent successfully.",
    joinRequest,
  });
});

// @desc    Accept or reject room join request
// @route   PUT /api/rooms/requests/:requestId
// @access  Private
const handleJoinRequest = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'accepted' or 'rejected'
  const requestId = req.params.requestId;

  if (!["accepted", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status. Must be 'accepted' or 'rejected'.");
  }

  const joinRequest = await RoomJoinRequest.findById(requestId);
  if (!joinRequest) {
    res.status(404);
    throw new Error("Join request not found.");
  }

  if (joinRequest.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Unauthorized to respond to this request.");
  }

  joinRequest.status = status;
  await joinRequest.save();

  if (status === "accepted") {
    const room = await ExpenseRoom.findById(joinRequest.room);
    if (room && !room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }
  }

  // Generate notification for the user who sent the join request
  await Notification.create({
    user: joinRequest.user,
    title: "Room Join Request Update",
    message: `Your request to join the room has been ${status}.`,
    type: "room_request_update",
    relatedRoom: joinRequest.room,
  });

  res.status(200).json({
    success: true,
    message: `Join request ${status} successfully.`,
    joinRequest,
  });
});

// @desc    Add expense to a room (with optional splitting across members)
// @route   POST /api/rooms/:id/expense
// @access  Private
const addRoomExpense = asyncHandler(async (req, res) => {
  const roomId = req.params.id;
  const { amount, description, category, mode, paidBy, splitBetween } = req.body;

  const room = await ExpenseRoom.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error("Expense room not found.");
  }

  // Check membership
  const isMember = room.members.some((m) => m.toString() === req.user._id.toString());
  if (!isMember) {
    res.status(403);
    throw new Error("You must be a member of this room to add expenses.");
  }

  // Check configuration permission if not creator
  const isCreator = room.creator.toString() === req.user._id.toString();
  if (!isCreator && !room.allowMembersToAddExpense) {
    res.status(403);
    throw new Error("The creator has disabled member expense additions for this room.");
  }

  const expensePayer = paidBy || req.user._id;
  const totalAmount = parseFloat(amount);
  const createdExpenses = [];

  // If splitBetween is provided and has members
  if (splitBetween && Array.isArray(splitBetween) && splitBetween.length > 0) {
    // Split equally among the selected members
    const splitAmount = totalAmount / splitBetween.length;

    for (const memberId of splitBetween) {
      const isPayer = memberId.toString() === expensePayer.toString();

      const splitExpense = await Expense.create({
        amount: parseFloat(splitAmount.toFixed(2)),
        category: category || "General",
        description: description || "Room expense",
        mode: mode || "Cash",
        roomId: room._id,
        user: memberId,              // The user record this expense belongs to
        paidBy: expensePayer,        // Who actually paid the bill
        splitBetween: splitBetween,  // All members involved in the split
        isSplit: true,
        isPaid: isPayer,             // True for the payer, false for others
      });

      createdExpenses.push(splitExpense);

      // Notify other members if they didn't pay
      if (!isPayer) {
        await Notification.create({
          user: memberId,
          title: "New Split Expense",
          message: `You owe a split share of $${splitAmount.toFixed(2)} in the room "${room.title}".`,
          type: "expense_split",
          relatedRoom: room._id,
        });
      }
    }
  } else {
    // If no split, record full amount for the payer
    const singleExpense = await Expense.create({
      amount: totalAmount,
      category: category || "General",
      description: description || "Room expense",
      mode: mode || "Cash",
      roomId: room._id,
      user: expensePayer,
      paidBy: expensePayer,
      splitBetween: [],
      isSplit: false,
      isPaid: true,
    });
    createdExpenses.push(singleExpense);
  }

  res.status(201).json({
    success: true,
    message: "Room expense recorded and split successfully.",
    expenses: createdExpenses,
  });
});

// @desc    Get user's expense rooms
// @route   GET /api/rooms
// @access  Private
const getUserRooms = asyncHandler(async (req, res) => {
  const rooms = await ExpenseRoom.find({ members: req.user._id })
    .populate("creator", "name email")
    .populate("members", "name email");

  res.status(200).json({
    success: true,
    rooms,
  });
});

// @desc    Get room details, total expenses, and related expenses list
// @route   GET /api/rooms/:id
// @access  Private
const getRoomDetails = asyncHandler(async (req, res) => {
  const roomId = req.params.id;

  const room = await ExpenseRoom.findById(roomId)
    .populate("creator", "name email")
    .populate("members", "name email");

  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  // Fetch all expenses associated with this room and populate user details
  const expenses = await Expense.find({ roomId: room._id })
    .populate("paidBy", "name email")
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  // Calculate total expenses for the room
  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  res.status(200).json({
    success: true,
    room,
    expenses,
    totalExpenses,
  });
});

export {
  createExpenseRoom,
  inviteUserToRoom,
  handleJoinRequest,
  addRoomExpense,
  getUserRooms,
  getRoomDetails,
};