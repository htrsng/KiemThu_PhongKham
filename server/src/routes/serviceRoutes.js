const express = require('express');
const factory = require('../controllers/handlerFactory');
const Service = require('../models/Service');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
  .get(factory.getAll(Service))
  .post(authorize('Admin'), async (req, res, next) => {
    try {
      if (req.body.code) {
        const existingCode = await Service.findOne({ code: req.body.code });
        if (existingCode) return res.status(400).json({ error: 'Mã Dịch vụ đã tồn tại' });
      }
      if (req.body.name) {
        const existingName = await Service.findOne({ name: req.body.name });
        if (existingName) return res.status(400).json({ error: 'Tên Dịch vụ đã tồn tại' });
      }
      if (req.body.description && req.body.description.length > 500) {
        return res.status(400).json({ error: 'Mô tả vượt quá số ký tự cho phép' });
      }
      factory.createOne(Service)(req, res, next);
    } catch (err) {
      next(err);
    }
  });

router.route('/:id')
  .get(factory.getOne(Service))
  .put(authorize('Admin'), async (req, res, next) => {
    try {
      if (req.body.name) {
        const existingName = await Service.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
        if (existingName) return res.status(400).json({ error: 'Tên Dịch vụ đã tồn tại' });
      }
      factory.updateOne(Service)(req, res, next);
    } catch (err) {
      next(err);
    }
  })
  .patch(authorize('Admin'), factory.updateOne(Service))
  .delete(authorize('Admin'), async (req, res, next) => {
    try {
      // Check Invoice
      const Invoice = require('../models/Invoice');
      const invoiceCount = await Invoice.countDocuments({ 'items.service': req.params.id });
      if (invoiceCount > 0) {
        return res.status(400).json({ error: 'Không thể xóa dịch vụ đã phát sinh giao dịch, vui lòng đổi trạng thái sang Ngừng cung cấp.' });
      }
      
      // Check TreatmentRecord
      const TreatmentRecord = require('../models/TreatmentRecord');
      const treatmentCount = await TreatmentRecord.countDocuments({ 'services.service': req.params.id });
      if (treatmentCount > 0) {
        return res.status(400).json({ error: 'Không thể xóa dịch vụ đã phát sinh giao dịch, vui lòng đổi trạng thái sang Ngừng cung cấp.' });
      }

      factory.deleteOne(Service)(req, res, next);
    } catch (err) {
      next(err);
    }
  });

module.exports = router;
