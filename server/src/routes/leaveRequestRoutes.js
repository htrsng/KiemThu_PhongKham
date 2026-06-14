const express = require('express');
const LeaveRequest = require('../models/LeaveRequest');
const Shift = require('../models/Shift');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(async (req, res, next) => {
    try {
      const filter = {};
      if (req.user.role === 'Doctor') {
        if (!req.user.referenceId) return res.status(403).json({ error: 'Chưa map tài khoản với Bác sĩ' });
        filter.doctorId = req.user.referenceId;
      }
      const requests = await LeaveRequest.find(filter).sort('-createdAt');
      res.json({ data: requests.map(d => d.toJSON()) });
    } catch (err) {
      next(err);
    }
  })
  .post(async (req, res, next) => {
    try {
      if (req.user.role === 'Doctor' && req.user.referenceId?.toString() !== req.body.doctorId) {
         return res.status(403).json({ error: 'Chỉ có thể tạo đơn cho chính mình' });
      }

      const today = new Date();
      today.setHours(0,0,0,0);
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);

      if (startDate < today) return res.status(400).json({ error: 'Không thể tạo đơn nghỉ trong quá khứ' });
      if (endDate < startDate) return res.status(400).json({ error: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu' });

      const leave = await LeaveRequest.create({ ...req.body, status: 'Pending' });
      res.status(201).json({ data: leave.toJSON() });
    } catch (err) {
      next(err);
    }
  });

router.route('/:id')
  .put(async (req, res, next) => {
    try {
      const leave = await LeaveRequest.findById(req.params.id);
      if (!leave) return res.status(404).json({ error: 'Not found' });

      if (req.user.role === 'Doctor' && req.user.referenceId?.toString() !== leave.doctorId.toString()) {
         return res.status(403).json({ error: 'Không có quyền sửa đơn của người khác' });
      }

      if (req.user.role === 'Doctor' && leave.status !== 'Pending') {
         return res.status(400).json({ error: 'Chỉ có thể sửa hoặc hủy đơn đang Chờ duyệt' });
      }

      // Admin duyệt đơn
      if (req.body.status === 'Approved' && req.user.role === 'Admin') {
         leave.status = 'Approved';
         // Clear overlapping shifts
         const startStr = new Date(leave.startDate).toISOString().split('T')[0];
         const endStr = new Date(leave.endDate).toISOString().split('T')[0];
         await Shift.deleteMany({
            doctorId: leave.doctorId,
            date: { $gte: startStr, $lte: endStr }
         });
      } else if (req.body.status) {
         // Allow doctor to cancel, or admin to reject
         if (req.body.status === 'Cancelled' || req.user.role === 'Admin') {
            leave.status = req.body.status;
         }
      }

      if (req.body.reason && leave.status === 'Pending') leave.reason = req.body.reason;
      if (req.body.startDate && leave.status === 'Pending') leave.startDate = req.body.startDate;
      if (req.body.endDate && leave.status === 'Pending') leave.endDate = req.body.endDate;

      await leave.save();
      res.json({ data: leave.toJSON() });
    } catch (err) {
      next(err);
    }
  });

module.exports = router;
