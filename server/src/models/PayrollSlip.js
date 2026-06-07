const mongoose = require('mongoose');

const payrollSlipSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Nháp', 'Đã chốt'],
        default: 'Đã chốt'
    },
    totalSalary: {
        type: Number,
        required: true
    },
    totalHours: {
        type: Number,
        default: 0
    },
    hourlyRateUsed: {
        type: Number,
        default: 0
    },
    details: {
        type: Array, // Lưu chi tiết từng ca (thành mảng object cố định)
        default: []
    },
    lockedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Mỗi bác sĩ chỉ có 1 phiếu lương chốt mỗi tháng
payrollSlipSchema.index({ doctorId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('PayrollSlip', payrollSlipSchema);
