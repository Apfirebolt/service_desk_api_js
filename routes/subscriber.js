import express from 'express'
import {
  createSubscriber,
  unsubscribeUser,
  getSubscribers,
} from '../controllers/subscriberController.js'
// import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriberResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a2f1b2c9e7b2a123456789"
 *         email:
 *           type: string
 *           example: "john.doe@example.com"
 *         isSubscribed:
 *           type: boolean
 *           example: true
 *         isVerified:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/subscribers:
 *   post:
 *     summary: Register a new newsletter subscriber
 *     tags: [Subscribers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *     responses:
 *       201:
 *         description: Successfully subscribed to the newsletter
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
 *                   example: "Successfully subscribed to the newsletter!"
 *                 subscriber:
 *                   $ref: '#/components/schemas/SubscriberResponse'
 *       400:
 *         description: Email is required or already subscribed
 *       500:
 *         description: Server error
 */
router.post('/', createSubscriber)

/**
 * @swagger
 * /api/subscribers/unsubscribe:
 *   post:
 *     summary: Unsubscribe from the newsletter
 *     tags: [Subscribers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Successfully unsubscribed from the newsletter
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
 *                   example: "Successfully unsubscribed from the newsletter"
 *       404:
 *         description: Subscriber not found
 *       500:
 *         description: Server error
 */
router.post('/unsubscribe', unsubscribeUser)

/**
 * @swagger
 * /api/subscribers:
 *   get:
 *     summary: Get all newsletter subscribers (Admin only)
 *     tags: [Subscribers]
 *     responses:
 *       200:
 *         description: List of all subscribers successfully retrieved
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
 *                   example: 10
 *                 subscribers:
 *amos               type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubscriberResponse'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
// Add middleware like `protect, admin` if required: router.get('/', protect, admin, getSubscribers)
router.get('/', getSubscribers)

export default router