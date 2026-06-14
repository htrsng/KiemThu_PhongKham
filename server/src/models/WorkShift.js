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
  },
  maxPatients: {
    type: Number,
    default: 10,
    min: [1, 'Số lượng bệnh nhân tối đa phải lớn hơn 0']
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkShift', workShiftSchema);
