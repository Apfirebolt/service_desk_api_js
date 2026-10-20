import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Budget from "../models/budget.js";
import Expense from "../models/expense.js";

// @desc    Get user budgets with actual spending progress for a given month/year
// @route   GET /api/budget?month=8&year=2026
// @access  Private
const getUserBudgets = asyncHandler(async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();

  // 1. Fetch all budget limits set by the user for the requested month and year
  const budgets = await Budget.find({ user: req.user._id, month, year }).sort({ createdAt: -1 });

  // 2. Aggregate actual expenses for this user within that specific month range
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const spendingSummary = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
        createdAt: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: "$category", // Fixed to match the 'category' field in your Expense model
        totalSpent: { $sum: "$amount" }
      }
    }
  ]);

  // 3. Merge budget limits with actual category spending
  const budgetProgress = budgets.map((budget) => {
    const match = spendingSummary.find((item) => item._id === budget.category);
    const spent = match ? match.totalSpent : 0;
    const remaining = budget.limit - spent;
    const percentage = budget.limit > 0 ? Math.min(Math.round((spent / budget.limit) * 100), 100) : 0;

    return {
      _id: budget._id,
      category: budget.category,
      limit: budget.limit,
      spent,
      remaining,
      percentage,
      month: budget.month,
      year: budget.year,
      description: budget.description,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  });

  res.status(200).json({
    success: true,
    month,
    year,
    count: budgetProgress.length,
    budgets: budgetProgress,
  });
});

// @desc    Create or update a monthly category budget
// @route   POST /api/budget
// @access  Private - User
const setBudget = asyncHandler(async (req, res) => {
  const { category, limit, month, year, description } = req.body;

  if (!category || limit === undefined || !month || !year) {
    res.status(400);
    throw new Error("Please provide category, limit, month, and year.");
  }

  // Check if a budget for this category and month already exists for the user
  const existingBudget = await Budget.findOne({
    user: req.user._id,
    category,
    month,
    year,
  });

  let budget;
  if (existingBudget) {
    // Update existing limit
    existingBudget.limit = limit;
    if (description !== undefined) existingBudget.description = description;
    budget = await existingBudget.save();
  } else {
    // Create new budget entry
    budget = await Budget.create({
      category,
      limit,
      month,
      year,
      description: description || "",
      user: req.user._id,
    });
  }

  if (budget) {
    res.status(201).json({
      success: true,
      message: "Budget successfully saved",
      budget,
    });
  } else {
    res.status(400);
    throw new Error("Invalid Budget data");
  }
});

// @desc    Update existing Budget by ID
// @route   PATCH /api/budget/:id
// @access  Private - Owner or Admin
const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);

  if (!budget) {
    res.status(404);
    throw new Error("Budget not found");
  }

  if (
    budget.user.toString() !== req.user._id.toString() &&
    req.user.isAdmin === false
  ) {
    res.status(403);
    throw new Error("Only Budget owner or admin can edit this budget");
  }

  budget.limit = req.body.limit !== undefined ? req.body.limit : budget.limit;
  budget.category = req.body.category || budget.category;
  budget.description = req.body.description !== undefined ? req.body.description : budget.description;

  const updatedBudget = await budget.save();

  res.status(200).json({
    success: true,
    budget: updatedBudget,
  });
});

// @desc    Delete existing Budget by ID
// @route   DELETE /api/budget/:id
// @access  Private - Owner or Admin
const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);

  if (!budget) {
    res.status(404);
    throw new Error("Budget not found");
  }

  if (
    budget.user.toString() !== req.user._id.toString() &&
    req.user.isAdmin === false
  ) {
    res.status(403);
    throw new Error("Only Budget owner or admin can delete this budget");
  }

  await Budget.deleteOne({ _id: req.params.id, user: req.user._id });

  res.status(200).json({
    success: true,
    message: "Budget removed successfully",
  });
});

// @desc    Get single Budget by ID
// @route   GET /api/budget/:id
// @access  Private - Owner or Admin
const getBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);

  if (!budget) {
    res.status(404);
    throw new Error("Budget not found");
  }

  if (
    budget.user.toString() !== req.user._id.toString() &&
    req.user.isAdmin === false
  ) {
    res.status(403);
    throw new Error("Only Budget owner or admin can view this budget");
  }

  res.status(200).json({
    success: true,
    budget,
  });
});

export {
  getUserBudgets,
  setBudget,
  updateBudget,
  deleteBudget,
  getBudget,
};