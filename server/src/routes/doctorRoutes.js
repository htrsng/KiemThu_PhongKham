const express = require('express');
const factory = require('../controllers/handlerFactory');
const Doctor = require('../models/Doctor');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
  .get(factory.getAll(Doctor))
  .post(authorize('Admin', 'Reception'), async (req, res, next) => {
    try {
      if (!req.body.specialty) return res.status(400).json({ error: 'Vui lòng chọn chuyên khoa' });
      if (!req.body.degree) return res.status(400).json({ error: 'Vui lòng chọn học vị' });
      
      if (req.body.email) {
        const existingEmail = await Doctor.findOne({ email: req.body.email });
        if (existingEmail) return res.status(400).json({ error: 'Email này đã được sử dụng cho một bác sĩ/nhân viên khác' });
      }
      
      if (req.body.phone) {
        const existingPhone = await Doctor.findOne({ phone: req.body.phone });
        if (existingPhone) return res.status(400).json({ error: 'Số điện thoại này đã được đăng ký' });
      }

      factory.createOne(Doctor)(req, res, next);
    } catch (err) {
      next(err);
    }
  });

router.route('/:id')
  .get(factory.getOne(Doctor))
  .put(async (req, res, next) => {
    if (req.user.role === 'Doctor' && req.user.referenceId?.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Không có quyền sửa thông tin bác sĩ khác' });
    }
    if (req.body.email) {
      const existingEmail = await Doctor.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
      if (existingEmail) return res.status(400).json({ error: 'Email đã tồn tại' });
    }
    factory.updateOne(Doctor)(req, res, next);
  })
  .patch(async (req, res, next) => {
    if (req.user.role === 'Doctor' && req.user.referenceId?.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Không có quyền sửa thông tin bác sĩ khác' });
    }
    factory.updateOne(Doctor)(req, res, next);
  })
  .delete(authorize('Admin', 'Reception'), async (req, res, next) => {
    try {
      const Appointment = require('../models/Appointment');
      const count = await Appointment.countDocuments({ doctor: req.params.id });
      if (count > 0) {
        return res.status(400).json({ error: 'Bác sĩ đang có lịch hẹn, vui lòng chuyển lịch trước khi xóa/vô hiệu hóa.' });
      }
      
      const TreatmentRecord = require('../models/TreatmentRecord');
      const treatmentCount = await TreatmentRecord.countDocuments({ doctor: req.params.id });
      if (treatmentCount > 0) {
        return res.status(400).json({ error: 'Hệ thống chặn xóa cứng, chỉ cho phép Vô hiệu hóa (Deactivate) để giữ lịch sử.' });
      }
      
      factory.deleteOne(Doctor)(req, res, next);
    } catch (err) {
      next(err);
    }
  });

module.exports = router;
