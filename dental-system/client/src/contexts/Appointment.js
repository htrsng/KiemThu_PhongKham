const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Đã lên lịch', 'Đã hoàn thành', 'Đã hủy'],
        default: 'Đã lên lịch',
    },
    notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);