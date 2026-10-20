import asyncHandler from "express-async-handler";
import { ExpenseRoom, RoomJoinRequest } from "../models/room.js";
import Expense from "../models/expense.js";

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
  const { userId, notificationMessage } = req.body;
  const roomId = req.params.id;

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

  // Check if user is already a member
  if (room.members.some((m) => m.toString() === userId)) {
    res.status(400);
    throw new Error("User is already a member of this room.");
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
  const { amount, type, description, category, mode, expenseType, splitBetween } = req.body;

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

  // 1. Create primary expense for the current user
  const primaryExpense = await Expense.create({
    amount: parseFloat(amount),
    type: type || category || "General",
    category: category || type || "General",
    description: description || "Room expense",
    mode: mode || "Cash",
    expenseType: expenseType || "Variable",
    isSplit: false,
    user: req.user._id,
  });

  const createdSplitExpenses = [primaryExpense];

  // 2. Handle Splitting if requested (splitBetween is an array of member IDs or boolean flag)
  if (splitBetween && Array.isArray(splitBetween) && splitBetween.length > 0) {
    const splitAmount = parseFloat(amount) / (splitBetween.length + 1); // Splitting equally among selected members + payer

    for (const memberId of splitBetween) {
      if (memberId !== req.user._id.toString()) {
        const splitExpense = await Expense.create({
          amount: parseFloat(splitAmount.toFixed(2)),
          type: type || category || "General",
          category: category || type || "General",
          description: `[Split from ${req.user.name || 'Room Member'}] ${description || ''}`,
          mode: mode || "Cash",
          expenseType: expenseType || "Variable",
          isSplit: true, // Marked true as requested
          user: memberId,
        });
        createdSplitExpenses.push(splitExpense);
      }
    }
  }

  res.status(201).json({
    success: true,
    message: "Room expense recorded successfully.",
    expenses: createdSplitExpenses,
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

export {
  createExpenseRoom,
  inviteUserToRoom,
  handleJoinRequest,
  addRoomExpense,
  getUserRooms,
};