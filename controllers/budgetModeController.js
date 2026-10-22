import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import BudgetMode from "../models/budgetMode.js";
import Expense from "../models/expense.js";

// @desc    Get user budget modes with actual spending progress for a given month/year
// @route   GET /api/budget-modes?month=8&year=2026
// @access  Private
const getUserBudgetModes = asyncHandler(async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();

  // 1. Fetch all payment mode budget limits set by the user for the requested month and year
  const budgetModes = await BudgetMode.find({ user: req.user._id, month, year }).sort({ createdAt: -1 });

  // 2. Aggregate actual expenses for this user within that specific month range, grouped by payment mode
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
        _id: "$paymentMode", // Matches the payment mode field in your Expense model
        totalSpent: { $sum: "$amount" }
      }
    }
  ]);

  // 3. Merge budget limits with actual payment mode spending
  const budgetModeProgress = budgetModes.map((budget) => {
    const match = spendingSummary.find((item) => item._id === budget.paymentMode);
    const spent = match ? match.totalSpent : 0;
    const remaining = budget.limit - spent;
    const percentage = budget.limit > 0 ? Math.min(Math.round((spent / budget.limit) * 100), 100) : 0;

    return {
      _id: budget._id,
      paymentMode: budget.paymentMode,
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
    count: budgetModeProgress.length,
    budgetModes: budgetModeProgress,
  });
});

// @desc    Create or update a monthly payment mode budget limit
// @route   POST /api/budget-modes
// @access  Private - User
const setBudgetMode = asyncHandler(async (req, res) => {
  const { paymentMode, limit, month, year, description } = req.body;

  if (!paymentMode || limit === undefined || !month || !year) {
    res.status(400);
    throw new Error("Please provide paymentMode, limit, month, and year.");
  }

  // Check if a budget for this payment mode and month already exists for the user
  const existingBudget = await BudgetMode.findOne({
    user: req.user._id,
    paymentMode,
    month,
    year,
  });

  let budgetMode;
  if (existingBudget) {
    // Update existing limit
    existingBudget.limit = limit;
    if (description !== undefined) existingBudget.description = description;
    budgetMode = await existingBudget.save();
  } else {
    // Create new budget mode entry
    budgetMode = await BudgetMode.create({
      paymentMode,
      limit,
      month,
      year,
      description: description || "",
      user: req.user._id,
    });
  }

  if (budgetMode) {
    res.status(201).json({
      success: true,
      message: "Payment mode budget successfully saved",
      budgetMode,
    });
  } else {
    res.status(400);
    throw new Error("Invalid Budget Mode data");
  }
});

// @desc    Update existing Budget Mode by ID
// @route   PATCH /api/budget-modes/:id
// @access  Private - Owner or Admin
const updateBudgetMode = asyncHandler(async (req, res) => {
  const budgetMode = await BudgetMode.findById(req.params.id);

  if (!budgetMode) {
    res.status(404);
    throw new Error("Budget Mode not found");
  }

  if (
    budgetMode.user.toString() !== req.user._id.toString() &&
    req.user.isAdmin === false
  ) {
    res.status(403);
    throw new Error("Only Budget owner or admin can edit this budget mode");
  }

  budgetMode.limit = req.body.limit !== undefined ? req.body.limit : budgetMode.limit;
  budgetMode.paymentMode = req.body.paymentMode || budgetMode.paymentMode;
  budgetMode.description = req.body.description !== undefined ? req.body.description : budgetMode.description;

  const updatedBudgetMode = await budgetMode.save();

  res.status(200).json({
    success: true,
    budgetMode: updatedBudgetMode,
  });
});

// @desc    Delete existing Budget Mode by ID
// @route   DELETE /api/budget-modes/:id
// @access  Private - Owner or Admin
const deleteBudgetMode = asyncHandler(async (req, res) => {
  const budgetMode = await BudgetMode.findById(req.params.id);

  if (!budgetMode) {
    res.status(404);
    throw new Error("Budget Mode not found");
  }

  if (
    budgetMode.user.toString() !== req.user._id.toString() &&
    req.user.isAdmin === false
  ) {
    res.status(403);
    throw new Error("Only Budget owner or admin can delete this budget mode");
  }

  await BudgetMode.deleteOne({ _id: req.params.id, user: req.user._id });

  res.status(200).json({
    success: true,
    message: "Payment mode budget removed successfully",
  });
});

// @desc    Get single Budget Mode by ID
// @route   GET /api/budget-modes/:id
// @access  Private - Owner or Admin
const getBudgetMode = asyncHandler(async (req, res) => {
  const budgetMode = await BudgetMode.findById(req.params.id);

  if (!budgetMode) {
    res.status(404);
    throw new Error("Budget Mode not found");
  }

  if (
    budgetMode.user.toString() !== req.user._id.toString() &&
    req.user.isAdmin === false
  ) {
    res.status(403);
    throw new Error("Only Budget owner or admin can view this budget mode");
  }

  res.status(200).json({
    success: true,
    budgetMode,
  });
});

export {
  getUserBudgetModes,
  setBudgetMode,
  updateBudgetMode,
  deleteBudgetMode,
  getBudgetMode,
};