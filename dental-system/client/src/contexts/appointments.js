const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// GET: Lấy tất cả lịch hẹn
router.get('/', async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ startTime: -1 });
        res.json({ data: appointments });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Tạo lịch hẹn mới
router.post('/', async (req, res) => {
    const appointment = new Appointment({ ...req.body });
    try {
        const newAppointment = await appointment.save();
        res.status(201).json({ data: newAppointment });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT: Cập nhật lịch hẹn
router.put('/:id', async (req, res) => {
    try {
        const updatedAppointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedAppointment) return res.status(404).json({ message: 'Appointment not found' });
        res.json({ data: updatedAppointment });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE: Xóa lịch hẹn
router.delete('/:id', async (req, res) => {
    try {
        const deletedAppointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!deletedAppointment) return res.status(404).json({ message: 'Appointment not found' });
        res.json({ deletedCount: 1, message: 'Appointment deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;