import express from 'express';
const router = express.Router();
import {
  getRecurringExpenses,
  createRecurringExpense,
  deleteRecurringExpense
} from '../controllers/recurringController.js';
import { protect } from '../middleware/authMiddleware.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     RecurringExpenseInput:
 *       type: object
 *       required:
 *         - amount
 *         - description
 *         - frequency
 *       properties:
 *         amount:
 *           type: number
 *           example: 15.99
 *         description:
 *           type: string
 *           example: Netflix Monthly Subscription
 *         category:
 *           type: string
 *           example: Entertainment
 *         frequency:
 *           type: string
 *           enum: [monthly, weekly, yearly]
 *           example: monthly
 *     RecurringExpense:
 *       allOf:
 *         - $ref: '#/components/schemas/RecurringExpenseInput'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d5ecb8b5c9c62b3c7c1a2b
 *             user:
 *               type: string
 *               example: 60d5ecb8b5c9c62b3c7c1a10
 *             isActive:
 *               type: boolean
 *               example: true
 *             lastGeneratedDate:
 *               type: string
 *               format: date-time
 *               example: 2026-10-01T00:00:00.000Z
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: 2026-09-01T10:20:00.000Z
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               example: 2026-09-01T10:20:00.000Z
 */

/**
 * @openapi
 * /api/recurring:
 *   get:
 *     summary: Get all recurring expenses for the authenticated user
 *     tags: [Recurring Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recurring expenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recurring:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RecurringExpense'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *   post:
 *     summary: Create a new recurring expense template
 *     tags: [Recurring Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecurringExpenseInput'
 *     responses:
 *       201:
 *         description: Recurring expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recurring:
 *                   $ref: '#/components/schemas/RecurringExpense'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */
router.route('/')
  .get(protect, getRecurringExpenses)
  .post(protect, createRecurringExpense);

/**
 * @openapi
 * /api/recurring/{id}:
 *   delete:
 *     summary: Delete a recurring expense template by ID
 *     tags: [Recurring Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Recurring Expense ObjectId
 *     responses:
 *       200:
 *         description: Recurring expense removed successfully
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
 *                   example: Recurring expense removed
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Recurring expense not found
 */
router.route('/:id')
  .delete(protect, deleteRecurringExpense);

export default router;