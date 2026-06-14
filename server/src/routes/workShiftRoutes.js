const express = require('express');
const factory = require('../controllers/handlerFactory');
const WorkShift = require('../models/WorkShift');
const Shift = require('../models/Shift');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Chặn trùng lặp hoặc startTime >= endTime
async function validateWorkShift(req, res, next) {
  const { startTime, endTime } = req.body;
  if (startTime && endTime) {
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({ error: 'Giờ kết thúc phải lớn hơn giờ bắt đầu' });
    }
  }

  // Check overlap (simplified)
  if (startTime || endTime) {
    const shifts = await WorkShift.find(req.params.id ? { _id: { $ne: req.params.id } } : {});
    const st = timeToMinutes(startTime || req.existingStartTime);
    const et = timeToMinutes(endTime || req.existingEndTime);

    for (let s of shifts) {
      const existingSt = timeToMinutes(s.startTime);
      const existingEt = timeToMinutes(s.endTime);
      if (Math.max(st, existingSt) < Math.min(et, existingEt)) {
        return res.status(400).json({ error: 'Ca làm việc bị trùng khung giờ với ca đã có' });
      }
    }
  }
  next();
}

router.route('/')
  .get(factory.getAll(WorkShift))
  .post(authorize('Admin'), validateWorkShift, factory.createOne(WorkShift));

router.route('/:id')
  .get(factory.getOne(WorkShift))
  .put(authorize('Admin'), async (req, res, next) => {
    const ws = await WorkShift.findById(req.params.id);
    if (!ws) return res.status(404).json({ error: 'Not found' });
    req.existingStartTime = ws.startTime;
    req.existingEndTime = ws.endTime;
    next();
  }, validateWorkShift, async (req, res, next) => {
     // Prevent update if currently active in a Shift
     const count = await Shift.countDocuments({ startTime: req.existingStartTime, endTime: req.existingEndTime });
     if (count > 0 && (req.body.startTime || req.body.endTime)) {
       return res.status(400).json({ error: 'Không thể cập nhật giờ của ca đang được gán cho lịch trực' });
     }
     factory.updateOne(WorkShift)(req, res, next);
  })
  .patch(authorize('Admin'), factory.updateOne(WorkShift))
  .delete(authorize('Admin'), async (req, res, next) => {
     try {
       const ws = await WorkShift.findById(req.params.id);
       if (!ws) return res.status(404).json({ error: 'Not found' });
       
       const count = await Shift.countDocuments({ startTime: ws.startTime, endTime: ws.endTime });
       if (count > 0) {
         return res.status(400).json({ error: 'Không thể xóa ca làm việc đang được gán cho lịch trực' });
       }
       factory.deleteOne(WorkShift)(req, res, next);
     } catch (err) {
       next(err);
     }
  });

module.exports = router;
