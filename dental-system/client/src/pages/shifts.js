const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const Doctor = require('../models/Doctor'); // Giả định bạn đã có model Doctor

// GET: Lấy tất cả ca trực
router.get('/', async (req, res) => {
    try {
        const shifts = await Shift.find().sort({ date: -1 });
        res.json({ data: shifts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Tạo một ca trực mới
router.post('/', async (req, res) => {
    try {
        const { doctorId, date, startTime, endTime } = req.body;

        // Tìm bác sĩ để lấy tên, đảm bảo dữ liệu nhất quán
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const newShift = new Shift({
            doctorId,
            doctorName: doctor.fullName, // Lấy tên từ model Doctor
            date,
            startTime,
            endTime,
        });

        const savedShift = await newShift.save();
        res.status(201).json({ data: savedShift });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT: Cập nhật một ca trực
router.put('/:id', async (req, res) => {
    try {
        let updateData = { ...req.body };

        // Nếu doctorId thay đổi, cập nhật lại doctorName
        if (req.body.doctorId) {
            const doctor = await Doctor.findById(req.body.doctorId);
            if (doctor) {
                updateData.doctorName = doctor.fullName;
            }
        }

        const updatedShift = await Shift.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedShift) {
            return res.status(404).json({ message: 'Shift not found' });
        }
        res.json({ data: updatedShift });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE: Xóa một ca trực
router.delete('/:id', async (req, res) => {
    try {
        const deletedShift = await Shift.findByIdAndDelete(req.params.id);
        if (!deletedShift) {
            return res.status(404).json({ message: 'Shift not found' });
        }
        res.json({ deletedCount: 1, message: 'Shift deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;