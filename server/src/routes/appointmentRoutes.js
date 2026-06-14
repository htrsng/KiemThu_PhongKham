const express = require('express');
const factory = require('../controllers/handlerFactory');
const Appointment = require('../models/Appointment');
const Shift = require('../models/Shift');
const WorkShift = require('../models/WorkShift');
const LeaveRequest = require('../models/LeaveRequest');
const appointmentController = require('../controllers/appointmentController');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

router.patch('/:id/checkin', appointmentController.checkIn);
router.post('/walk-in', appointmentController.walkIn);
router.patch('/:id/finish', appointmentController.finishTreatment);

const STATE_ORDER = {
  'Đã lên lịch': 1,
  'Đã đến': 2,
  'Đang điều trị': 3,
  'Đã hoàn thành': 4,
  'Đã hủy': 5 // Special case
};

router.route('/')
  .get(factory.getAll(Appointment))
  .post(async (req, res, next) => {
    try {
      const { doctorId, patientId, startTime, endTime } = req.body;
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const today = new Date();
      if (start < today) {
         return res.status(400).json({ error: 'Không thể đặt lịch hẹn trong quá khứ' });
      }

      // Check Leave
      const onLeave = await LeaveRequest.findOne({
         doctorId,
         status: 'Approved',
         startDate: { $lte: start },
         endDate: { $gte: start }
      });
      if (onLeave) return res.status(400).json({ error: 'Bác sĩ đang nghỉ phép' });

      // Check Shift
      const dateStr = start.toISOString().split('T')[0];
      const startH = start.getHours().toString().padStart(2, '0');
      const startM = start.getMinutes().toString().padStart(2, '0');
      const timeStr = `${startH}:${startM}`;

      const shifts = await Shift.find({ doctorId, date: dateStr });
      let validShift = null;
      for (let s of shifts) {
         if (s.startTime <= timeStr && s.endTime >= timeStr) {
            validShift = s;
            break;
         }
      }
      if (!validShift) return res.status(400).json({ error: 'Bác sĩ không có lịch trực vào khung giờ này' });

      // Check capacity
      const workShifts = await WorkShift.find();
      let maxCap = 10;
      for (let ws of workShifts) {
         if (ws.startTime === validShift.startTime && ws.endTime === validShift.endTime) {
            maxCap = ws.maxPatients;
            break;
         }
      }

      // Create boundaries for shift
      const shiftStartObj = new Date(`${dateStr}T${validShift.startTime}:00`);
      const shiftEndObj = new Date(`${dateStr}T${validShift.endTime}:00`);
      const aptCount = await Appointment.countDocuments({
         doctorId,
         status: { $ne: 'Đã hủy' },
         startTime: { $gte: shiftStartObj, $lt: shiftEndObj }
      });
      if (aptCount >= maxCap) {
         return res.status(400).json({ error: 'Ca trực của Bác sĩ đã đầy' });
      }

      // Prevent double booking same patient
      const startOfDay = new Date(start);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(start);
      endOfDay.setHours(23,59,59,999);
      const existing = await Appointment.findOne({
         doctorId, patientId, startTime: { $gte: startOfDay, $lte: endOfDay }, status: { $ne: 'Đã hủy' }
      });
      if (existing) return res.status(400).json({ error: 'Bệnh nhân đã đặt lịch với bác sĩ này trong ngày hôm nay' });

      factory.createOne(Appointment)(req, res, next);
    } catch (err) {
      next(err);
    }
  });

router.route('/:id')
  .get(factory.getOne(Appointment))
  .put(async (req, res, next) => {
    try {
      const apt = await Appointment.findById(req.params.id);
      if (!apt) return res.status(404).json({ error: 'Not found' });
      
      if (req.body.status) {
         const oldOrder = STATE_ORDER[apt.status];
         const newOrder = STATE_ORDER[req.body.status];
         if (req.body.status === 'Đã hủy') {
            if (apt.status !== 'Đã lên lịch') {
               return res.status(400).json({ error: 'Chỉ có thể hủy lịch khi đang ở trạng thái Đã lên lịch' });
            }
         } else if (newOrder <= oldOrder) {
            return res.status(400).json({ error: 'Không thể lùi trạng thái hoặc trạng thái không hợp lệ' });
         }
      }
      factory.updateOne(Appointment)(req, res, next);
    } catch (err) {
      next(err);
    }
  })
  .patch(async (req, res, next) => {
    try {
      const apt = await Appointment.findById(req.params.id);
      if (!apt) return res.status(404).json({ error: 'Not found' });
      
      if (req.body.status) {
         const oldOrder = STATE_ORDER[apt.status];
         const newOrder = STATE_ORDER[req.body.status];
         if (req.body.status === 'Đã hủy') {
            if (apt.status !== 'Đã lên lịch') {
               return res.status(400).json({ error: 'Chỉ có thể hủy lịch khi đang ở trạng thái Đã lên lịch' });
            }
         } else if (newOrder <= oldOrder) {
            return res.status(400).json({ error: 'Không thể lùi trạng thái' });
         }
      }
      factory.updateOne(Appointment)(req, res, next);
    } catch (err) {
      next(err);
    }
  })
  .delete(factory.deleteOne(Appointment));

module.exports = router;
