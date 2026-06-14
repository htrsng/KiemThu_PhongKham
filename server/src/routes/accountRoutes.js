const express = require('express');
const factory = require('../controllers/handlerFactory');
const Account = require('../models/Account');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

// Only Admin can access User Management
router.use(authorize('Admin'));

router.route('/')
  .get(factory.getAll(Account))
  .post(async (req, res, next) => {
    try {
      const existingUser = await Account.findOne({ username: req.body.username });
      if (existingUser) return res.status(400).json({ error: 'Username đã tồn tại, vui lòng chọn tên khác.' });
      
      const existingEmail = await Account.findOne({ email: req.body.email });
      if (existingEmail) return res.status(400).json({ error: 'Email này đã được sử dụng.' });
      
      factory.createOne(Account)(req, res, next);
    } catch (err) {
      next(err);
    }
  });

router.route('/:id')
  .get(factory.getOne(Account))
  .put(async (req, res, next) => {
    if (req.params.id === req.user.id.toString() && req.body.status === 'inactive') {
      return res.status(400).json({ error: 'Không thể khóa tài khoản đang đăng nhập' });
    }
    factory.updateOne(Account)(req, res, next);
  })
  .patch(async (req, res, next) => {
    if (req.params.id === req.user.id.toString() && req.body.status === 'inactive') {
      return res.status(400).json({ error: 'Không thể khóa tài khoản đang đăng nhập' });
    }
    factory.updateOne(Account)(req, res, next);
  })
  .delete(async (req, res, next) => {
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ error: 'Không thể xóa tài khoản đang đăng nhập' });
    }
    
    try {
      const targetAccount = await Account.findById(req.params.id);
      if (!targetAccount) return res.status(404).json({ error: 'Document not found' });
      
      if (targetAccount.role === 'Doctor' && targetAccount.referenceId) {
        const Appointment = require('../models/Appointment');
        const count = await Appointment.countDocuments({ doctor: targetAccount.referenceId });
        if (count > 0) {
           return res.status(400).json({ error: 'Không thể xóa bác sĩ đã có dữ liệu lịch khám. Chỉ có thể vô hiệu hóa.' });
        }
      }
      
      factory.deleteOne(Account)(req, res, next);
    } catch (err) {
      next(err);
    }
  });

module.exports = router;
