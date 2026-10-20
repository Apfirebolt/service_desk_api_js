import express from "express";
const router = express.Router();
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Flexible user notification management module (room invites, shared expenses, system alerts)
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 unreadCount:
 *                   type: integer
 *                   example: 1
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "6ad73a4dc9e1540e5fe9505d"
 *                       title:
 *                         type: string
 *                         example: "Expense Room Invitation"
 *                       message:
 *                         type: string
 *                         example: "You have been invited to join the room: Trip to Goa"
 *                       type:
 *                         type: string
 *                         enum: [room_invite, expense_split, system, general]
 *                         example: "room_invite"
 *                       isRead:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not authorized, token failed or missing
 */
router.route("/").get(protect, getUserNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read for the user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
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
 *                   example: "All notifications marked as read."
 *       401:
 *         description: Not authorized
 */
router.route("/read-all").put(protect, markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *     put:
 *       summary: Mark a specific notification as read
 *       tags: [Notifications]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: Notification ID
 *       responses:
 *         200:
 *           description: Notification updated successfully
 *         404:
 *           description: Notification not found
 *         403:
 *           description: Unauthorized action
 */
router.route("/:id/read").put(protect, markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *     delete:
 *       summary: Delete a specific notification
 *       tags: [Notifications]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: Notification ID
 *       responses:
 *         200:
 *           description: Notification removed successfully
 *         404:
 *           description: Notification not found
 *         403:
 *           description: Unauthorized action
 */
router.route("/:id").delete(protect, deleteNotification);

export default router;