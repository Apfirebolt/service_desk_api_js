import asyncHandler from "express-async-handler";
import Expense from "../models/expense.js";

// @desc    List of user expense
// @route   GET /api/expense
// @access  Private
const getUserExpenses = asyncHandler(async (req, res) => {
  const itemsPerPage = 50;
  const startPage = req.query.page || 1;
  await Expense.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: null, totalExpense: { $sum: "$amount" } } },
  ])
    .exec()
    .then(async (result) => {
      const totalExpense = result.length > 0 ? result[0].totalExpense : 0;
      const expenses = await Expense.find({ user: req.user._id })
        .populate("user", "firstName lastName")
        .populate("paidBy", "firstName lastName email")
        .populate("roomId", "title description")
        .skip(itemsPerPage * startPage - itemsPerPage)
        .limit(itemsPerPage)
        .exec();
      const count = await Expense.countDocuments({ user: req.user._id });
      res.status(200).json({
        expenses,
        totalExpense,
        total: count,
        success: true,
        itemsPerPage,
        startPage,
        lastPage: Math.ceil(count / itemsPerPage),
      });
    })
    .catch((err) => {
      return next(err);
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

  if (
    expense.user.toString() !== req.user._id.toString() &&
    req.user.isAdmin === false
  ) {
    res.status(403);
    throw new Error("Only Expense owner and admin can view Expenses");
  }

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

  const categories = [
    "Food & Dining",
    "Transport",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Health & Fitness",
    "Travel",
    "Other",
  ];

  const mode = [
    "Cash",
    "Credit Card",
    "Gift Card",
    "Debit Card",
    "Bank Transfer",
    "Mobile Payment",
    "Cheque",
    "UPI",
  ];

  const descriptions = [
    "Morning coffee and pastry",
    "Supermarket grocery run",
    "Fuel refill at station",
    "Dinner with colleagues",
    "Monthly streaming subscription",
    "Online electronics purchase",
    "Uber ride to downtown",
    "Pharmacy and medical supplies",
    "Weekend movie tickets",
    "Utility bill payment",
  ];

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

export {
  getUserExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpense,
  getDuplicateExpenses,
  generateMockExpenses,
  clearMockExpenses,
};
