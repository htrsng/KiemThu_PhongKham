const express = require('express');
const factory = require('../controllers/handlerFactory');
const Appointment = require('../models/Appointment');
const Shift = require('../models/Shift');
const WorkShift = require('../models/WorkShift');
const LeaveRequest = require('../models/LeaveRequest');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();
const validId = (value) => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

// Scope every appointment route, including check-in and finish, to the authenticated doctor.
router.use(async (req, res, next) => {
  try {
    if (req.user.role === 'Doctor') {
      const doctorId = req.user.referenceId;
      if (!doctorId) return res.status(403).json({ error: 'Doctor profile is required' });
      req.appointmentDoctorId = doctorId;
      if (Object.hasOwn(req.body || {}, 'doctorId') && String(req.body.doctorId) !== String(doctorId)) {
        return res.status(403).json({ error: 'Cannot assign appointments to another doctor' });
      }
    }
    next();
  } catch (error) { next(error); }
});
router.param('id', async (req, res, next, id) => {
  try {
    if (!validId(id)) return res.status(400).json({ error: 'Invalid appointment ID' });
    if (req.appointmentDoctorId && !await Appointment.exists({ _id: id, doctorId: req.appointmentDoctorId })) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    next();
  } catch (error) { next(error); }
});
router.use((req, res, next) => {
  for (const field of ['doctorId', 'patientId', 'serviceId']) {
    if (Object.hasOwn(req.body || {}, field) && !validId(req.body[field])) {
      return res.status(400).json({ error: `Invalid ${field}` });
    }
  }
  for (const field of ['startTime', 'endTime']) {
    if (Object.hasOwn(req.body || {}, field) &&
        (typeof req.body[field] !== 'string' || !req.body[field].trim() || !Number.isFinite(Date.parse(req.body[field])))) {
      return res.status(400).json({ error: `Invalid ${field}` });
    }
  }
  next();
});

router.patch('/:id/checkin', appointmentController.checkIn);
router.post('/walk-in', appointmentController.walkIn);
router.patch('/:id/finish', appointmentController.finishTreatment);

router.route('/')
  .get((req, res, next) => {
    if (req.appointmentDoctorId) {
      // Trusted scope is merged after all query parameters, never supplied by the caller.
      req.resourceScope = { doctorId: req.appointmentDoctorId };
    }
    return factory.getAll(Appointment)(req, res, next);
  })
  .post(async (req, res, next) => {
    try {
      const { doctorId, patientId, startTime, endTime } = req.body;
      if (!validId(doctorId) || !validId(patientId) || !startTime || !endTime) {
        return res.status(400).json({ error: 'doctorId, patientId, startTime and endTime are required' });
      }
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
        return res.status(400).json({ error: 'Appointment end must be after a valid start' });
      }
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
  .put(appointmentController.updateAppointment)
  .patch(appointmentController.updateAppointment)
  .delete(factory.deleteOne(Appointment));

module.exports = router;
