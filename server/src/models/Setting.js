const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  settingCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

// Rename _id to id in JSON output
settingSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('Setting', settingSchema);
