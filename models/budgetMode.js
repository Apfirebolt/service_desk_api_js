import mongoose from "mongoose";

const budgetModeSchema = new mongoose.Schema(
  {
    paymentMode: {
      type: String,
      required: [true, "Payment mode is required (e.g., Credit Card, UPI, Cash)"],
      trim: true,
    },
    limit: {
      type: Number,
      required: [true, "Payment mode budget limit is required"],
      min: [0, "Budget limit cannot be negative"],
    },
    month: {
      type: Number,
      required: [true, "Month is required"],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

budgetModeSchema.index({ user: 1, paymentMode: 1, month: 1, year: 1 }, { unique: true });

const BudgetMode = mongoose.models.BudgetMode || mongoose.model('BudgetMode', budgetModeSchema);

export default BudgetMode;