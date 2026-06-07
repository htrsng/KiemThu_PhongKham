const mongoose = require('mongoose');

const treatmentRecordSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        required: true,
        index: true
    },
    patientId: {
        type: String,
        required: true,
        index: true
    },
    doctorId: {
        type: String,
        required: true
    },
    diagnosis: {
        type: String,
        default: ''
    },
    treatmentPlan: {
        type: String,
        default: ''
    },
    materials: {
        type: String,
        default: ''
    },
    materialsUsed: [{
        materialId: String,
        name: String,
        quantity: Number
    }],
    prescription: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    dentalChart: [{
        toothId: Number,
        status: String
    }]
}, {
    timestamps: true
});

// Use custom schema options to remove _v and format output
treatmentRecordSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('TreatmentRecord', treatmentRecordSchema);
