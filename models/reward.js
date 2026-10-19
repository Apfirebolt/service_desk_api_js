import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One reward profile per user
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedBudgetsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    badges: [
      {
        title: { type: String, required: true }, // e.g., "Budget Master", "Saver Pro"
        description: { type: String },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    history: [
      {
        month: { type: Number, required: true },
        year: { type: Number, required: true },
        category: { type: String, required: true },
        pointsEarned: { type: Number, required: true },
        reason: { type: String, default: "Stayed under monthly budget limit" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Reward = mongoose.models.Reward || mongoose.model('Reward', rewardSchema);

export default Reward;