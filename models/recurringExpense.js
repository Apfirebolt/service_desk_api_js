import mongoose from "mongoose";

const recurringExpenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: false
  },
  frequency: {
    type: String,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly'
  },
  lastGeneratedDate: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const RecurringExpense = mongoose.models.RecurringExpense || mongoose.model('RecurringExpense', recurringExpenseSchema);

export default RecurringExpense;