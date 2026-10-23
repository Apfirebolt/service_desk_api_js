import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Recipient of the notification
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["room_invite", "expense_split", "system", "general", "expense_mark_paid", "expense_confirmed"],
      default: "general",
    },
    relatedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseRoom",
      required: false,
    },
    relatedExpense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;