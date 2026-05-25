const mongoose = require('mongoose');

const workShiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a shift name'],
    trim: true,
  },
  startTime: {
    type: String,
    required: [true, 'Please add a start time'],
  },
  endTime: {
    type: String,
    required: [true, 'Please add an end time'],
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkShift', workShiftSchema);
