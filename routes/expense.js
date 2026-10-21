import express from 'express';
const router = express.Router();
import {
  createExpense,
  getExpense,
  getUserExpenses,
  deleteExpense,
  updateExpense,
  getDuplicateExpenses,
  generateMockExpenses,
  clearMockExpenses,
  markSplitPaymentPaid,
  confirmSplitPayment
} from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     ExpenseInput:
 *       type: object
 *       required:
 *         - amount
 *         - type
 *         - description
 *       properties:
 *         amount:
 *           type: number
 *           example: 45.50
 *         type:
 *           type: string
 *           example: Food & Dining
 *         description:
 *           type: string
 *           example: Lunch at cafeteria
 *     Expense:
 *       allOf:
 *         - $ref: '#/components/schemas/ExpenseInput'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d5ecb8b5c9c62b3c7c1a1a
 *             user:
 *               type: string
 *               example: 60d5ecb8b5c9c62b3c7c1a10
 *             settlementStatus:
 *               type: string
 *               enum: [unpaid, pending_confirmation, settled]
 *               example: unpaid
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: 2026-08-12T10:20:00.000Z
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               example: 2026-08-12T10:20:00.000Z
 */

/**
 * @openapi
 * /api/expense/duplicate-expenses:
 *   get:
 *     summary: Get duplicate expenses
 *     tags: [Expenses]
 *     responses:
 *       200:
 *         description: List of duplicate expenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 *       500:
 *         description: Server error
 */
router
  .route('/duplicate-expenses')
  .get(getDuplicateExpenses);

router
  .route('/generate-mock')
  .post(protect, generateMockExpenses)
  .delete(protect, clearMockExpenses);

/**
 * @openapi
 * /api/expense:
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpenseInput'
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Invalid input / Missing required fields
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *   get:
 *     summary: Get all expenses for the authenticated user
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */
router.route('/')
  .post(protect, createExpense)
  .get(protect, getUserExpenses);

/**
 * @openapi
 * /api/expense/{expenseId}/mark-paid:
 *   put:
 *     summary: Mark split expense share as paid by debtor
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Expense ObjectId
 *     responses:
 *       200:
 *         description: Marked as paid successfully. Awaiting payer confirmation.
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
 *                   example: Marked as paid. Awaiting payer confirmation.
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Unauthorized action on this expense share
 *       404:
 *         description: Expense share not found
 */
router.route('/:expenseId/mark-paid').put(protect, markSplitPaymentPaid);

/**
 * @openapi
 * /api/expense/{expenseId}/confirm-settlement:
 *   put:
 *     summary: Confirm split expense payment received by creditor
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Expense ObjectId
 *     responses:
 *       200:
 *         description: Payment successfully confirmed and settled!
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
 *                   example: Payment successfully confirmed and settled!
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Only the user who made the original payment can confirm receipt.
 *       404:
 *         description: Expense share not found
 */
router.route('/:expenseId/confirm-settlement').put(protect, confirmSplitPayment);

/**
 * @openapi
 * /api/expense/{id}:
 *   get:
 *     summary: Get expense by ID
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Expense ObjectId
 *     responses:
 *       200:
 *         description: Expense details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Expense not found
 *   patch:
 *     summary: Update an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Expense ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 50.00
 *               type:
 *                 type: string
 *                 example: Transport
 *               description:
 *                 type: string
 *                 example: Taxi fare
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Expense not found
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Expense ObjectId
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Expense not found
 */
router
  .route('/:id')
  .get(protect, getExpense)
  .patch(protect, updateExpense)
  .delete(protect, deleteExpense);

export default router;