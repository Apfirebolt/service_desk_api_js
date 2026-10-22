import express from 'express'
const router = express.Router()
import {
  getUserBudgetModes,
  setBudgetMode,
  updateBudgetMode,
  deleteBudgetMode,
  getBudgetMode
} from '../controllers/budgetModeController.js'
import { protect } from '../middleware/authMiddleware.js'

/**
 * @openapi
 * components:
 *   schemas:
 *     BudgetModeInput:
 *       type: object
 *       required:
 *         - paymentMode
 *         - limit
 *         - month
 *         - year
 *       properties:
 *         paymentMode:
 *           type: string
 *           example: Credit Card
 *         limit:
 *           type: number
 *           example: 10000.00
 *         month:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 8
 *         year:
 *           type: integer
 *           example: 2026
 *         description:
 *           type: string
 *           example: Monthly credit card spending cap
 *     BudgetMode:
 *       allOf:
 *         - $ref: '#/components/schemas/BudgetModeInput'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d5ecb8b5c9c62b3c7c1a2b
 *             user:
 *               type: string
 *               example: 60d5ecb8b5c9c62b3c7c1a10
 *             spent:
 *               type: number
 *               example: 3500.00
 *             remaining:
 *               type: number
 *               example: 6500.00
 *             percentage:
 *               type: integer
 *               example: 35
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
 * /api/budget-modes:
 *   get:
 *     summary: Get user budget modes with actual spending progress for a month/year
 *     tags: [Budget Modes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month number (1-12)
 *         example: 8
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Four-digit year
 *         example: 2026
 *     responses:
 *       200:
 *         description: List of user budget modes with calculation progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 month:
 *                   type: integer
 *                   example: 8
 *                 year:
 *                   type: integer
 *                   example: 2026
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 budgetModes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BudgetMode'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *   post:
 *     summary: Create or update a monthly payment mode budget limit
 *     tags: [Budget Modes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BudgetModeInput'
 *     responses:
 *       201:
 *         description: Payment mode budget successfully saved
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
 *                   example: Payment mode budget successfully saved
 *                 budgetMode:
 *                   $ref: '#/components/schemas/BudgetMode'
 *       400:
 *         description: Invalid input data / Missing required fields
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */
router.route('/')
  .get(protect, getUserBudgetModes)
  .post(protect, setBudgetMode)

/**
 * @openapi
 * /api/budget-modes/{id}:
 *   get:
 *     summary: Get budget mode by ID
 *     tags: [Budget Modes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB BudgetMode ObjectId
 *     responses:
 *       200:
 *         description: Budget mode details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 budgetMode:
 *                   $ref: '#/components/schemas/BudgetMode'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Not budget owner
 *       404:
 *         description: Budget mode not found
 *   patch:
 *     summary: Update an existing budget mode
 *     tags: [Budget Modes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB BudgetMode ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentMode:
 *                   type: string
 *                   example: UPI
 *                 limit:
 *                   type: number
 *                   example: 6000.00
 *                 description:
 *                   type: string
 *                   example: Updated UPI monthly cap
 *     responses:
 *       200:
 *         description: Budget mode updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 budgetMode:
 *                   $ref: '#/components/schemas/BudgetMode'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Not budget owner
 *       404:
 *         description: Budget mode not found
 *   delete:
 *     summary: Delete a budget mode
 *     tags: [Budget Modes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB BudgetMode ObjectId
 *     responses:
 *       200:
 *         description: Payment mode budget removed successfully
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
 *                   example: Payment mode budget removed successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Not budget owner
 *       404:
 *         description: Budget mode not found
 */
router
  .route('/:id')
  .get(protect, getBudgetMode)
  .patch(protect, updateBudgetMode)
  .delete(protect, deleteBudgetMode)

export default router