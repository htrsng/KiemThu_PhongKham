const mongoose = require('mongoose');

const payrollConfigHistorySchema = new mongoose.Schema({
  baseHourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  shiftMultipliers: {
    morning: { type: Number, required: true, min: 1 },
    afternoon: { type: Number, required: true, min: 1 },
    evening: { type: Number, required: true, min: 1 },
    weekend: { type: Number, required: true, min: 1 },
    holiday: { type: Number, required: true, min: 1 }
  },
  defaultConsultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Sort ascending by default to easily find the correct config by date
payrollConfigHistorySchema.index({ effectiveDate: -1 });

module.exports = mongoose.model('PayrollConfigHistory', payrollConfigHistorySchema);
