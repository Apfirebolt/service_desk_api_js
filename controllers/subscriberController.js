import asyncHandler from "express-async-handler";
import Subscriber from "../models/subscriber.js";

// @desc    Register a new newsletter subscriber
// @route   POST /api/subscribers
// @access  Public
const createSubscriber = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email address is required");
  }

  // Check if subscriber already exists
  const subscriberExists = await Subscriber.findOne({ email: email.toLowerCase().trim() });

  if (subscriberExists) {
    // If they were previously unsubscribed, re-subscribe them automatically
    if (!subscriberExists.isSubscribed) {
      subscriberExists.isSubscribed = true;
      await subscriberExists.save();
      
      return res.status(200).json({
        success: true,
        message: "Successfully re-subscribed to the newsletter!",
        subscriber: {
          _id: subscriberExists._id,
          email: subscriberExists.email,
          isSubscribed: subscriberExists.isSubscribed,
          createdAt: subscriberExists.createdAt,
        },
      });
    }

    res.status(400);
    throw new Error("This email is already subscribed");
  }

  // Create new subscriber
  const subscriber = await Subscriber.create({
    email,
    isSubscribed: true,
  });

  if (subscriber) {
    res.status(201).json({
      success: true,
      message: "Successfully subscribed to the newsletter!",
      subscriber: {
        _id: subscriber._id,
        email: subscriber.email,
        isSubscribed: subscriber.isSubscribed,
        createdAt: subscriber.createdAt,
      },
    });
  } else {
    res.status(400);
    throw new Error("Invalid subscriber data");
  }
});

// @desc    Unsubscribe from newsletter
// @route   POST /api/subscribers/unsubscribe
// @access  Public
const unsubscribeUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email address is required");
  }

  const subscriber = await Subscriber.findOne({ email: email.toLowerCase().trim() });

  if (!subscriber) {
    res.status(404);
    throw new Error("Subscriber not found");
  }

  subscriber.isSubscribed = false;
  await subscriber.save();

  res.status(200).json({
    success: true,
    message: "Successfully unsubscribed from the newsletter",
  });
});

// @desc    Get all subscribers (Admin only)
// @route   GET /api/subscribers
// @access  Private/Admin
const getSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: subscribers.length,
    subscribers,
  });
});

export {
  createSubscriber,
  unsubscribeUser,
  getSubscribers,
};