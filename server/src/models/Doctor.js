const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  licenseNumber: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  specialty: { type: String },
  degree: { type: String },
  experience: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  consultationFee: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  serviceCommissionRate: { type: Number, default: 0 },
  schedule: { type: mongoose.Schema.Types.Mixed, default: {} }, // T2, T3...
}, { timestamps: true });

doctorSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('Doctor', doctorSchema);
