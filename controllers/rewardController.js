import asyncHandler from "express-async-handler";
import Reward from "../models/reward.js";
import Budget from "../models/budget.js";

// @desc    Get user reward profile, points, badges, and history
// @route   GET /api/reward
// @access  Private
const getUserRewards = asyncHandler(async (req, res) => {
  let rewardProfile = await Reward.findOne({ user: req.user._id });

  if (!rewardProfile) {
    // Initialize reward profile if it doesn't exist yet
    rewardProfile = await Reward.create({
      user: req.user._id,
      totalPoints: 0,
      completedBudgetsCount: 0,
      badges: [],
      history: [],
    });
  }

  res.status(200).json({
    success: true,
    reward: rewardProfile,
  });
});

// @desc    Claim points for completing a monthly budget target
// @route   POST /api/reward/claim
// @access  Private
const claimBudgetReward = asyncHandler(async (req, res) => {
  const { budgetId } = req.body;

  if (!budgetId) {
    res.status(400);
    throw new Error("Budget ID is required to claim reward points.");
  }

  // 1. Fetch the budget to verify ownership and check if spent <= limit
  const budget = await Budget.findById(budgetId);

  if (!budget) {
    res.status(404);
    throw new Error("Budget not found.");
  }

  if (budget.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Unauthorized to claim reward for this budget.");
  }

  // 2. Check if user stayed under or equal to their limit
  // Note: We assume budget object already has `spent` calculated or we verify via expenses.
  // For safety, let's verify actual spending against this budget category for that month/year.
  const startDate = new Date(budget.year, budget.month - 1, 1);
  const endDate = new Date(budget.year, budget.month, 1);

  const Expense = (await import("../models/expense.js")).default;
  const spendingResult = await Expense.aggregate([
    {
      $match: {
        user: req.user._id,
        type: budget.category,
        createdAt: { $gte: startDate,$lt: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$amount" },
      },
    },
  ]);

  const totalSpent = spendingResult.length > 0 ? spendingResult[0].totalSpent : 0;

  if (totalSpent > budget.limit) {
    res.status(400);
    throw new Error(`Target not met! You spent $${totalSpent.toFixed(2)} against your limit of $${budget.limit.toFixed(2)}.`);
  }

  // 3. Fetch or create reward profile
  let rewardProfile = await Reward.findOne({ user: req.user._id });
  if (!rewardProfile) {
    rewardProfile = await Reward.create({ user: req.user._id });
  }

  // 4. Check if reward for this specific budget/month/category was already claimed
  const alreadyClaimed = rewardProfile.history.some(
    (h) => h.month === budget.month && h.year === budget.year && h.category === budget.category
  );

  if (alreadyClaimed) {
    res.status(400);
    throw new Error("Reward for this monthly budget target has already been claimed.");
  }

  // 5. Award Points & Badges
  const pointsEarned = 150; // Points rewarded for staying under budget
  rewardProfile.totalPoints += pointsEarned;
  rewardProfile.completedBudgetsCount += 1;

  rewardProfile.history.push({
    month: budget.month,
    year: budget.year,
    category: budget.category,
    pointsEarned,
    reason: `Successfully stayed under budget for ${budget.category} (${budget.month}/${budget.year})`,
  });

  // Check for milestone badges
  if (rewardProfile.completedBudgetsCount === 1) {
    rewardProfile.badges.push({ title: "First Saver", description: "Completed your first monthly budget goal!" });
  } else if (rewardProfile.completedBudgetsCount === 5) {
    rewardProfile.badges.push({ title: "Budget Master", description: "Successfully met 5 monthly budget targets!" });
  } else if (rewardProfile.completedBudgetsCount === 10) {
    rewardProfile.badges.push({ title: "Financial Guru", description: "Met 10 monthly budget targets. Elite saving!" });
  }

  await rewardProfile.save();

  res.status(200).json({
    success: true,
    message: `Congratulations! Earned ${pointsEarned} reward points.`,
    reward: rewardProfile,
  });
});

export {
  getUserRewards,
  claimBudgetReward,
};