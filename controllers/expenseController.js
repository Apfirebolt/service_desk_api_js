import asyncHandler from "express-async-handler";
import Expense from "../models/expense.js";
import Notification from "../models/notification.js";
import { categories, mode, descriptions } from "../utils/constants.js";

// @desc    List of user expense
// @route   GET /api/expense
// @access  Private
const getUserExpenses = asyncHandler(async (req, res) => {
  const itemsPerPage = 50;
  const startPage = Number(req.query.page) || 1;
  const pendingConfirmationOnly = req.query.pendingConfirmation === 'true';

  // Build match query
  let matchQuery = { user: req.user._id };

  if (pendingConfirmationOnly) {
    // If querying items where the logged-in user is the creditor awaiting confirmation
    matchQuery = {
      paidBy: req.user._id,
      isSplit: true,
      settlementStatus: "pending_confirmation"
    };
  }

  const count = await Expense.countDocuments(matchQuery);
  const expenses = await Expense.find(matchQuery)
    .populate("user", "firstName lastName email")
    .populate("paidBy", "firstName lastName email")
    .populate("roomId", "title description")
    .skip(itemsPerPage * startPage - itemsPerPage)
    .limit(itemsPerPage)
    .exec();

  res.status(200).json({
    success: true,
    expenses,
    total: count,
    itemsPerPage,
    startPage,
    lastPage: Math.ceil(count / itemsPerPage),
  });
});

// @desc    Create a Expense
// @route   POST /api/expense
// @access  Private - User
const createExpense = asyncHandler(async (req, res) => {
  const { amount, type, description, mode, category } = req.body;

  const expense = await Expense.create({
    amount,
    mode,
    type,
    category,
    description,
    user: req.user._id,
  });

  if (expense) {
    res.status(201).json(expense);
  } else {
    res.status(400);
    throw new Error("Invalid Expense data");
  }
});

// @desc    Update existing Expense
// @route   PATCH /api/expense/id
// @access  Private - Admin only
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id });

  if (
    expense &&
    expense.user.toString() !== req.user._id.toString() &&
    req.user.isAdmin === false
  ) {
    res.status(403);
    throw new Error("Only Expense owner or admin can edit Expense");
  }

  // if an expense is split, it can only be edited by person who paid it
  if (expense && expense.isSplit && expense.paidBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the person who paid the split expense can edit it.");
  }

  if (expense) {
    expense.amount = req.body.amount || expense.amount;
    expense.description = req.body.description || expense.description;
    expense.type = req.body.type || expense.type;
    expense.mode = req.body.mode || expense.mode;
    expense.category = req.body.category || expense.category;
    const updatedExpense = await expense.save();

    res.json(updatedExpense);
  } else {
    res.status(404);
    throw new Error("Expense not found");
  }
});

// @desc    Delete existing Expense
// @route   DELETE /api/expense/id
// @access  Private - Admin or User
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (
    expense.user.toString() !== req.user._id.toString() &&
    req.user.isAdmin === false
  ) {
    res.status(403);
    throw new Error("Only Expense owner or admin can delete Expense");
  }

  // if the expense is split, it cannot be deleted
  if (expense && expense.isSplit) {
    res.status(400);
    throw new Error("Split expenses cannot be deleted individually.");
  }

  if (expense) {
    await Expense.deleteOne({
      _id: req.params.id,
      user: req.user._id,
    });
    res.json({ message: "Expense removed" });
  } else {
    res.status(404);
    throw new Error("Expense not found");
  }
});

// @desc    Get existing Expense
// @route   GET /api/expense/id
// @access  Private - User or Admin
const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (expense) {
    res.json(expense);
  } else {
    res.status(404);
    throw new Error("Expense not found");
  }
});

// @desc    Generate random test expenses for a given month
// @route   POST /api/expense/generate-mock
// @access  Private
const generateMockExpenses = asyncHandler(async (req, res) => {
  const {
    count = 10,
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear(),
  } = req.body;

  // Validate requested count
  const validCounts = [10, 20, 30, 40];
  const numCount = Number(count);
  if (!validCounts.includes(numCount)) {
    res.status(400);
    throw new Error("Invalid count. Please specify 10, 20, 30, or 40 items.");
  }

  const mockExpensesData = [];

  for (let i = 0; i < numCount; i++) {
    // Generate a random date within the specified month and year
    const randomDay = Math.floor(Math.random() * 28) + 1;
    const randomHour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
    const randomMinute = Math.floor(Math.random() * 60);
    const expenseDate = new Date(
      year,
      month - 1,
      randomDay,
      randomHour,
      randomMinute,
    );

    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    const randomMode = mode[Math.floor(Math.random() * mode.length)];
    const randomDescription =
      descriptions[Math.floor(Math.random() * descriptions.length)];
    const randomAmount = +(Math.random() * 120 + 5).toFixed(2); // Random amount between $5.00 and $125.00

    mockExpensesData.push({
      amount: randomAmount,
      category: randomCategory,
      mode: randomMode,
      description: `${randomDescription} (Test)`,
      isAutoGenerated: true,
      user: req.user._id,
      createdAt: expenseDate,
      updatedAt: expenseDate,
    });
  }

  // Insert mock expenses into database
  const createdExpenses = await Expense.insertMany(mockExpensesData);

  res.status(201).json({
    success: true,
    message: `${createdExpenses.length} mock expenses successfully generated for ${month}/${year}`,
    count: createdExpenses.length,
    expenses: createdExpenses,
  });
});

// @desc    Delete all auto-generated test expenses for the user
// @route   DELETE /api/expense/generate-mock
// @access  Private
const clearMockExpenses = asyncHandler(async (req, res) => {
  const result = await Expense.deleteMany({
    user: req.user._id,
    isAutoGenerated: true,
  });

  res.status(200).json({
    success: true,
    message: `Successfully cleared ${result.deletedCount} test expenses.`,
    deletedCount: result.deletedCount,
  });
});

// @desc    Number of duplicate expenses
// @route   GET /api/duplicate-expenses
// @access  Private
const getDuplicateExpenses = asyncHandler(async (req, res, next) => {
  await Expense.find({})
    .exec()
    .then(async (result) => {
      const totalExpense = result.length > 0 ? result[0].totalExpense : 0;
      const count = await Expense.countDocuments({});
      res.status(200).json({
        totalExpense,
        total: count,
        success: true,
      });
    })
    .catch((err) => {
      return next(err);
    });
});

// @desc    Mark split expense share as paid by debtor (Alice / Bob)
// @route   PUT /api/expense/:expenseId/mark-paid
// @access  Private
const markSplitPaymentPaid = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user._id;

  const expense = await Expense.findById(expenseId);
  if (!expense) {
    res.status(404);
    throw new Error("Expense share not found");
  }

  if (expense.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Unauthorized action on this expense share");
  }

  expense.settlementStatus = "pending_confirmation";
  await expense.save();

  // generate notification for the creditor (paidBy) that the debtor has marked the expense as paid
  if (expense.paidBy) {
    await Notification.create({
      user: expense.paidBy,
      title: "Expense Marked as Paid",
      message: `${req.user.email} has marked the expense "${expense.description}" as paid.`,
      type: "expense_mark_paid",
      referenceId: expense._id,
      relatedExpense: expense._id,
    });
  }

  res.status(200).json({
    success: true,
    message: "Marked as paid. Awaiting payer confirmation.",
    expense,
  });
});

// @desc    Confirm split expense payment received by creditor (Ryan / paidBy)
// @route   PUT /api/expense/:expenseId/confirm-settlement
// @access  Private
const confirmSplitPayment = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user._id;

  const expense = await Expense.findById(expenseId);
  if (!expense) {
    res.status(404);
    throw new Error("Expense share not found");
  }

  if (!expense.paidBy || expense.paidBy.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Only the user who made the original payment can confirm receipt.");
  }

  expense.settlementStatus = "settled";
  expense.isPaid = true;
  expense.confirmedBy = userId;
  await expense.save();

  // generate notification for the debtor (user) that the creditor has confirmed the payment
  if (expense.user) {
    await Notification.create({
      user: expense.user,
      title: "Expense Payment Confirmed",
      message: `${req.user.email} has confirmed the payment for the expense "${expense.description}".`,
      type: "expense_confirmed",
      referenceId: expense._id,
      relatedExpense: expense._id,
    });
  }

  res.status(200).json({
    success: true,
    message: "Payment successfully confirmed and settled!",
    expense,
  });
});

export {
  getUserExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpense,
  getDuplicateExpenses,
  generateMockExpenses,
  clearMockExpenses,
  markSplitPaymentPaid,
  confirmSplitPayment,
};