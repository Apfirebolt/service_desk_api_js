import express from "express";
const router = express.Router();
import {
  createExpenseRoom,
  inviteUserToRoom,
  handleJoinRequest,
  addRoomExpense,
  getUserRooms,
} from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";

/**
 * @openapi
 * /api/rooms:
 *   get:
 *     summary: Get all expense rooms for the authenticated user
 *     tags: [Expense Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rooms retrieved successfully
 *   post:
 *     summary: Create a new expense room
 *     tags: [Expense Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: Goa Trip 2026
 *               description:
 *                 type: string
 *                 example: Shared expenses for accommodation and food.
 *               allowMembersToAddExpense:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Room created successfully
 */
router.route("/").get(protect, getUserRooms).post(protect, createExpenseRoom);

/**
 * @openapi
 * /api/rooms/{id}/invite:
 *   post:
 *     summary: Send a room join request to a user
 *     tags: [Expense Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60d5ecb8b5c9c62b3c7c1a10
 *               notificationMessage:
 *                 type: string
 *                 example: You are invited to join Goa Trip 2026
 *     responses:
 *       201:
 *         description: Join request sent successfully
 */
router.route("/:id/invite").post(protect, inviteUserToRoom);

/**
 * @openapi
 * /api/rooms/requests/{requestId}:
 *   put:
 *     summary: Accept or reject a room join request
 *     tags: [Expense Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Request handled successfully
 */
router.route("/requests/:requestId").put(protect, handleJoinRequest);

/**
 * @openapi
 * /api/rooms/{id}/expense:
 *   post:
 *     summary: Add an expense to an expense room with optional splitting
 *     tags: [Expense Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - category
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 150.00
 *               category:
 *                 type: string
 *                 example: Food & Dining
 *               description:
 *                 type: string
 *                 example: Dinner at beach shack
 *               splitBetween:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d5ecb8b5c9c62b3c7c1a11", "60d5ecb8b5c9c62b3c7c1a12"]
 *     responses:
 *       201:
 *         description: Expense added and split successfully
 */
router.route("/:id/expense").post(protect, addRoomExpense);

export default router;