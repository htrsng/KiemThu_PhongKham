const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  licenseNumber: { type: String, required: true, unique: true },
  fullName: { type: String, required: true, maxlength: [100, 'Tên bác sĩ không được vượt quá 100 ký tự'] },
  phone: { type: String, match: [/^[0-9]{10,11}$/, 'Số điện thoại phải từ 10-11 số'] },
  email: { type: String, match: [/^\S+@\S+\.\S+$/, 'Định dạng email không hợp lệ'] },
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
