const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  doctorName: { type: String, required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  serviceName: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Đã lên lịch', 'Đã đến', 'Đang điều trị', 'Đã hoàn thành', 'Đã hủy'],
    default: 'Đã lên lịch'
  },
  notes: { type: String },
  checkInTime: { type: Date },
  difficulty: { type: Number, default: 0 }, // Mức độ khó (0.0 -> 0.5)
}, { timestamps: true });

appointmentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

module.exports = mongoose.model('Appointment', appointmentSchema);
