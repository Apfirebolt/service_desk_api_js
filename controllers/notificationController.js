import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.js";

// @desc    Get all notifications for authenticated user
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount,
    notifications,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found.");
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Unauthorized action.");
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

  res.status(200).json({
    success: true,
    message: "All notifications marked as read.",
  });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found.");
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Unauthorized action.");
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: "Notification removed.",
  });
});

export {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};