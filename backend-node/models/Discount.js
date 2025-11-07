const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  discount_type: {
    type: String,
    enum: ['scholarship', 'sibling', 'merit', 'financial_aid'],
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  fixed_amount: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Discount', discountSchema);
