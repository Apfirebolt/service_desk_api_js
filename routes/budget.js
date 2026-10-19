import express from 'express'
const router = express.Router()
import {
  getUserBudgets,
  setBudget,
  updateBudget,
  deleteBudget,
  getBudget
} from '../controllers/budgetController.js'
import { protect } from '../middleware/authMiddleware.js'

/**
 * @openapi
 * components:
 *   schemas:
 *     BudgetInput:
 *       type: object
 *       required:
 *         - category
 *         - limit
 *         - month
 *         - year
 *       properties:
 *         category:
 *           type: string
 *           example: Food & Dining
 *         limit:
 *           type: number
 *           example: 500.00
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
 *           example: Monthly dining allowance
 *     Budget:
 *       allOf:
 *         - $ref: '#/components/schemas/BudgetInput'
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
 *               example: 150.50
 *             remaining:
 *               type: number
 *               example: 349.50
 *             percentage:
 *               type: integer
 *               example: 30
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
 * /api/budget:
 *   get:
 *       summary: Get user budgets with actual spending progress for a month/year
 *       tags: [Budgets]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: month
 *           schema:
 *             type: integer
 *           description: Month number (1-12)
 *           example: 8
 *         - in: query
 *           name: year
 *           schema:
 *             type: integer
 *           description: Four-digit year
 *           example: 2026
 *       responses:
 *         200:
 *           description: List of user budgets with calculation progress
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   month:
 *                     type: integer
 *                     example: 8
 *                   year:
 *                     type: integer
 *                     example: 2026
 *                   count:
 *                     type: integer
 *                     example: 3
 *                   budgets:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Budget'
 *         401:
 *           description: Unauthorized - Token missing or invalid
 *   post:
 *       summary: Create or update a monthly category budget
 *       tags: [Budgets]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetInput'
 *       responses:
 *         201:
 *           description: Budget successfully saved
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: Budget successfully saved
 *                   budget:
 *                     $ref: '#/components/schemas/Budget'
 *         400:
 *           description: Invalid input data / Missing required fields
 *         401:
 *           description: Unauthorized - Token missing or invalid
 */
router.route('/')
  .get(protect, getUserBudgets)
  .post(protect, setBudget)

/**
 * @openapi
 * /api/budget/{id}:
 *   get:
 *       summary: Get budget by ID
 *       tags: [Budgets]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: MongoDB Budget ObjectId
 *       responses:
 *         200:
 *           description: Budget details retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   budget:
 *                     $ref: '#/components/schemas/Budget'
 *         401:
 *           description: Unauthorized - Token missing or invalid
 *         403:
 *           description: Forbidden - Not budget owner
 *         404:
 *           description: Budget not found
 *   patch:
 *       summary: Update an existing budget
 *       tags: [Budgets]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: MongoDB Budget ObjectId
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   type: string
 *                   example: Travel
 *                 limit:
 *                   type: number
 *                   example: 600.00
 *                 description:
 *                   type: string
 *                   example: Updated travel allowance
 *       responses:
 *         200:
 *           description: Budget updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   budget:
 *                     $ref: '#/components/schemas/Budget'
 *         401:
 *           description: Unauthorized - Token missing or invalid
 *         403:
 *           description: Forbidden - Not budget owner
 *         404:
 *           description: Budget not found
 *   delete:
 *       summary: Delete a budget
 *       tags: [Budgets]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: MongoDB Budget ObjectId
 *       responses:
 *         200:
 *           description: Budget removed successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: Budget removed successfully
 *         401:
 *           description: Unauthorized - Token missing or invalid
 *         403:
 *           description: Forbidden - Not budget owner
 *         404:
 *           description: Budget not found
 */
router
  .route('/:id')
  .get(protect, getBudget)
  .patch(protect, updateBudget)
  .delete(protect, deleteBudget)

export default router