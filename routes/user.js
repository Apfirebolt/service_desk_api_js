import express from 'express'
import {
  getUsers,
  getSingleUser,
} from '../controllers/userController.js'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a2f1b2c9e7b2a123456789"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           example: "john.doe@example.com"
 *         isAdmin:
 *           type: boolean
 *           example: false
 *         userType:
 *           type: string
 *           enum: [member, staff]
 *           example: "member"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserResponse'
 *       500:
 *         description: Server error
 */
router.get('/', getUsers)

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getSingleUser)

export default router