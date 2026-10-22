import cron from 'node-cron';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Notification from '../models/notification.js';
import dotenv from 'dotenv';

dotenv.config();

const TARGET_EMAIL = 'alexa@gmail.com';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/expense_tracker');
    console.log('📦 Worker connected to MongoDB successfully.');
  } catch (err) {
    console.error('❌ MongoDB connection error in worker:', err);
    process.exit(1);
  }
};

connectDB();

// Schedule job to run EVERY 1 MINUTE (* * * * *)
cron.schedule('* * * * *', async () => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 🔄 Running test notification background job...`);

  try {
    // 1. Find the target test user
    const user = await User.findOne({ email: TARGET_EMAIL });

    if (!user) {
      console.warn(`⚠️ Test user with email "${TARGET_EMAIL}" not found in database. Skipping notification generation.`);
      return;
    }

    // 2. Create the dummy notification
    const newNotification = await Notification.create({
      user: user._id,
      title: "Test Alert & Notification",
      message: `This is a dummy test notification generated at ${timestamp}.`,
      type: "system",
      isRead: false,
    });

    console.log(`✅ Success! Created notification for ${TARGET_EMAIL} (ID: ${newNotification._id})`);
  } catch (err) {
    console.error('❌ Error creating test notification:', err);
  }
});

console.log(`🚀 Test notification worker started! Listening for cron trigger every 1 minute for "${TARGET_EMAIL}"...`);