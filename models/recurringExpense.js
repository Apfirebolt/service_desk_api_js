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
  billingDay: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  lastGeneratedDate: {
    type: Date,
    required: false,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const RecurringExpense = mongoose.models.RecurringExpense || mongoose.model('RecurringExpense', recurringExpenseSchema);

export default RecurringExpense;