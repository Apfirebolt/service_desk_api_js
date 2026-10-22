import dotenv from 'dotenv';
import User from '../models/user.js';
import Budget from '../models/budget.js';
import Expense from '../models/expense.js';
import Notification from '../models/notification.js';

dotenv.config();

// Helper to prevent spamming duplicate notifications on the same day
async function alreadyNotifiedToday(userId, titleKeyword) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await Notification.findOne({
    user: userId,
    title: { $regex: titleKeyword, $options: 'i' },
    createdAt: { $gte: startOfDay }
  });
  return Boolean(existing);
}

/**
 * 1. Budget Exceeded Notification Checker
 */
export async function checkBudgetExceeded() {
  console.log('🔍 Running budget exceeded check...');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  try {
    const users = await User.find({});

    for (const user of users) {
      const budgets = await Budget.find({ user: user._id, month: currentMonth, year: currentYear });
      if (!budgets.length) continue;

      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

      for (const budget of budgets) {
        const aggregation = await Expense.aggregate([
          {
            $match: {
              user: user._id,
              category: budget.category,
              createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' }
            }
          }
        ]);

        const totalSpent = aggregation[0]?.totalSpent || 0;

        if (totalSpent > budget.limit) {
          const titleKeyword = `Budget Exceeded: ${budget.category}`;
          const alreadySent = await alreadyNotifiedToday(user._id, titleKeyword);

          if (!alreadySent) {
            const currency = user.settings?.currency || 'USD';
            await Notification.create({
              user: user._id,
              title: `⚠️ Budget Limit Exceeded (${budget.category})`,
              message: `You've spent ${currency} ${totalSpent.toFixed(2)} out of your ${currency} ${budget.limit.toFixed(2)} limit for ${budget.category} this month.`,
              type: 'system'
            });
            console.log(`⚠️ Budget alert sent to ${user.email} for ${budget.category}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Error in checkBudgetExceeded:', err);
  }
}

/**
 * 2. Daily Expense Summary Notification
 */
export async function sendDailyExpenseSummary() {
  console.log('📊 Running daily expense summary notification...');
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const users = await User.find({});

    for (const user of users) {
      const count = await Expense.countDocuments({
        user: user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      if (count > 0) {
        const titleKeyword = 'Daily Expense Summary';
        const alreadySent = await alreadyNotifiedToday(user._id, titleKeyword);

        if (!alreadySent) {
          await Notification.create({
            user: user._id,
            title: '📊 Daily Expense Summary',
            message: `You added ${count} expense ${count === 1 ? 'entry' : 'entries'} today. Keep up the great tracking habit!`,
            type: 'general'
          });
          console.log(`📊 Daily summary sent to ${user.email}: ${count} expenses.`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error in sendDailyExpenseSummary:', err);
  }
}

/**
 * 3. Reddit-Style Streak Congratulatory Notifications (3 days, 7 days, 14 days, 30 days...)
 */
export async function checkExpenseStreaks() {
  console.log('🔥 Running expense streak milestone check...');

  const milestoneDays = [3, 7, 14, 30, 60, 90, 365];

  try {
    const users = await User.find({});

    for (const user of users) {
      const expenses = await Expense.find({ user: user._id }).select('createdAt').sort({ createdAt: -1 });
      if (!expenses.length) continue;

      const uniqueDatesSet = new Set();
      expenses.forEach(exp => {
        const dateStr = new Date(exp.createdAt).toISOString().split('T')[0];
        uniqueDatesSet.add(dateStr);
      });

      const uniqueDates = Array.from(uniqueDatesSet).sort().reverse();

      let streak = 0;
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let checkDate = new Date();
      let checkDateStr = todayStr;

      if (!uniqueDates.includes(todayStr) && uniqueDates.includes(yesterdayStr)) {
        checkDate = new Date(Date.now() - 86400000);
        checkDateStr = yesterdayStr;
      }

      if (uniqueDates.includes(checkDateStr)) {
        while (true) {
          const dStr = checkDate.toISOString().split('T')[0];
          if (uniqueDates.includes(dStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      if (milestoneDays.includes(streak)) {
        const titleKeyword = `🔥 ${streak}-Day Streak Milestone`;
        const alreadySent = await alreadyNotifiedToday(user._id, titleKeyword);

        if (!alreadySent) {
          await Notification.create({
            user: user._id,
            title: `🔥 Awesome! ${streak}-Day Expense Tracking Streak!`,
            message: `You've logged expenses for ${streak} days in a row! That’s Reddit-level dedication to your financial goals. Keep the streak alive! 🚀`,
            type: 'system'
          });
          console.log(`🔥 Streak milestone (${streak} days) notification sent to ${user.email}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error in checkExpenseStreaks:', err);
  }
}