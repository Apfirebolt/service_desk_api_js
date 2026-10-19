import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Category type is required"],
      trim: true,
    },
    limit: {
      type: Number,
      required: [true, "Budget limit amount is required"],
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

// Compound index to ensure a user can only have one budget per category per month/year
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

export default Budget;