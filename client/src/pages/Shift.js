const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
    doctorId: {
        type: String,
        required: true,
    },
    doctorName: {
        type: String,
        required: true,
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
    },
    startTime: {
        type: String, // HH:mm
        required: true,
    },
    endTime: {
        type: String, // HH:mm
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Shift', ShiftSchema);