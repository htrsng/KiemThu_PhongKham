const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  doctorName: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true }, // HH:mm
  coefficient: { type: Number, default: 1.0 }, // Hệ số ca làm việc
  patientCoefficient: { type: Number, default: 0 }, // Tổng hệ số bệnh nhân của ca
  status: { type: String, enum: ['Đã đăng ký', 'Đã hủy'], default: 'Đã đăng ký' }, // Trạng thái ca trực
}, { timestamps: true });

shiftSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('Shift', shiftSchema);
