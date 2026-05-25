const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Please add a date']
  },
  name: {
    type: String,
    required: [true, 'Please add a holiday name'],
    trim: true,
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['HOLIDAY', 'MAINTENANCE', 'TRAINING', 'SYSTEM_CLOSED'],
    default: 'HOLIDAY'
  }
}, {
  timestamps: true
});

holidaySchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('Holiday', holidaySchema);
