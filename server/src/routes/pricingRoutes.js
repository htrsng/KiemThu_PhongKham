const express = require('express');
const factory = require('../controllers/handlerFactory');
const PricingPolicy = require('../models/PricingPolicy');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
  .get(factory.getAll(PricingPolicy))
  .post(authorize('Admin'), async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const effectiveDate = new Date(req.body.effectiveDate);
      if (effectiveDate < today) {
        return res.status(400).json({ error: 'Ngày hiệu lực phải lớn hơn hoặc bằng ngày hiện tại' });
      }
      
      const existingPolicy = await PricingPolicy.findOne({
        serviceId: req.body.serviceId,
        effectiveDate: effectiveDate
      });
      if (existingPolicy) {
        return res.status(400).json({ error: 'Đã tồn tại cấu hình giá cho ngày này' });
      }

      factory.createOne(PricingPolicy)(req, res, next);
    } catch (err) {
      next(err);
    }
  });

router.route('/:id')
  .get(factory.getOne(PricingPolicy))
  .put(authorize('Admin'), async (req, res, next) => {
    try {
      const policy = await PricingPolicy.findById(req.params.id);
      if (!policy) return res.status(404).json({ error: 'Not found' });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (policy.effectiveDate <= today) {
         return res.status(400).json({ error: 'Không thể sửa giá đang hoặc đã áp dụng. Vui lòng tạo giá mới.' });
      }
      
      if (req.body.effectiveDate) {
        const newEffectiveDate = new Date(req.body.effectiveDate);
        if (newEffectiveDate < today) {
          return res.status(400).json({ error: 'Ngày hiệu lực phải lớn hơn hoặc bằng ngày hiện tại' });
        }
        const existingPolicy = await PricingPolicy.findOne({
          serviceId: req.body.serviceId || policy.serviceId,
          effectiveDate: newEffectiveDate,
          _id: { $ne: policy._id }
        });
        if (existingPolicy) {
          return res.status(400).json({ error: 'Đã tồn tại cấu hình giá cho ngày này' });
        }
      }

      factory.updateOne(PricingPolicy)(req, res, next);
    } catch (err) {
      next(err);
    }
  })
  .patch(authorize('Admin'), async (req, res, next) => {
     try {
      const policy = await PricingPolicy.findById(req.params.id);
      if (!policy) return res.status(404).json({ error: 'Not found' });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (policy.effectiveDate <= today) {
         return res.status(400).json({ error: 'Không thể sửa giá đang hoặc đã áp dụng. Vui lòng tạo giá mới.' });
      }
      
      factory.updateOne(PricingPolicy)(req, res, next);
    } catch (err) {
      next(err);
    }
  })
  .delete(authorize('Admin'), async (req, res, next) => {
    try {
      const policy = await PricingPolicy.findById(req.params.id);
      if (!policy) return res.status(404).json({ error: 'Not found' });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (policy.effectiveDate <= today) {
         return res.status(400).json({ error: 'Không thể xóa giá trị lịch sử/hiện tại.' });
      }
      
      factory.deleteOne(PricingPolicy)(req, res, next);
    } catch (err) {
      next(err);
    }
  });

module.exports = router;
