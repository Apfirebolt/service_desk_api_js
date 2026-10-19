import express from 'express';
const router = express.Router();
import {
  getUserRewards,
  claimBudgetReward,
} from '../controllers/rewardController.js';
import { protect } from '../middleware/authMiddleware.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     Badge:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: First Saver
 *         description:
 *           type: string
 *           example: Completed your first monthly budget goal!
 *         earnedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-08-12T10:20:00.000Z
 *     RewardHistory:
 *       type: object
 *       properties:
 *         month:
 *           type: integer
 *           example: 8
 *         year:
 *           type: integer
 *           example: 2026
 *         category:
 *           type: string
 *           example: Food & Dining
 *         pointsEarned:
 *           type: integer
 *           example: 150
 *         reason:
 *           type: string
 *           example: Successfully stayed under budget for Food & Dining (8/2026)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-08-12T10:20:00.000Z
 *     RewardProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d5ecb8b5c9c62b3c7c1a3c
 *         user:
 *           type: string
 *           example: 60d5ecb8b5c9c62b3c7c1a10
 *         totalPoints:
 *           type: integer
 *           example: 450
 *         completedBudgetsCount:
 *           type: integer
 *           example: 3
 *         badges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Badge'
 *         history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RewardHistory'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-08-12T10:20:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-08-12T10:20:00.000Z
 */

/**
 * @openapi
 * /api/reward:
 *   get:
 *     summary: Get user reward profile, points, badges, and history
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reward profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reward:
 *                   $ref: '#/components/schemas/RewardProfile'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */
router.route('/').get(protect, getUserRewards);

/**
 * @openapi
 * /api/reward/claim:
 *   post:
 *     summary: Claim reward points for successfully meeting a monthly budget target
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budgetId
 *             properties:
 *               budgetId:
 *                 type: string
 *                 example: 60d5ecb8b5c9c62b3c7c1a2b
 *     responses:
 *       200:
 *         description: Reward points successfully claimed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Congratulations! Earned 150 reward points.
 *                 reward:
 *                   $ref: '#/components/schemas/RewardProfile'
 *       400:
 *         description: Target not met / Already claimed / Missing budgetId
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Budget not found
 */
router.route('/claim').post(protect, claimBudgetReward);

export default router;