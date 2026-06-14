const express = require('express');
const factory = require('../controllers/handlerFactory');
const TreatmentRecord = require('../models/TreatmentRecord');
const Material = require('../models/Material');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

async function validateTreatment(req, res, next) {
  try {
    const isCompleted = req.body.status === 'Completed';

    if (isCompleted && (!req.body.diagnosis || req.body.diagnosis.trim() === '')) {
       return res.status(400).json({ error: 'Bỏ trống chẩn đoán khi hoàn tất khám là không hợp lệ' });
    }

    if (req.body.materialsUsed && Array.isArray(req.body.materialsUsed)) {
       for (let item of req.body.materialsUsed) {
          if (!item.quantity || item.quantity <= 0) {
             return res.status(400).json({ error: 'Số lượng thuốc/vật tư phải lớn hơn 0' });
          }
          const mat = await Material.findById(item.materialId);
          if (!mat || mat.quantity < item.quantity) {
             return res.status(400).json({ error: `Thuốc/Vật tư ${item.name} đang hết hàng hoặc không đủ tồn kho` });
          }
       }
    }
    next();
  } catch (err) {
    next(err);
  }
}

router.route('/')
  .get(factory.getAll(TreatmentRecord))
  .post(authorize('Doctor', 'Admin'), validateTreatment, factory.createOne(TreatmentRecord));

router.route('/:id')
  .get(factory.getOne(TreatmentRecord))
  .put(authorize('Doctor', 'Admin'), async (req, res, next) => {
    try {
      const record = await TreatmentRecord.findById(req.params.id);
      if (!record) return res.status(404).json({ error: 'Not found' });
      
      if (record.status === 'Completed') {
         const hoursDiff = (new Date() - new Date(record.updatedAt)) / (1000 * 60 * 60);
         if (hoursDiff > 24) {
            return res.status(400).json({ error: 'Bệnh án đã khóa sổ sau 24h kể từ lúc hoàn tất, không thể sửa chữa' });
         }
      }
      next();
    } catch (err) {
      next(err);
    }
  }, validateTreatment, factory.updateOne(TreatmentRecord))
  .patch(authorize('Doctor', 'Admin'), async (req, res, next) => {
    try {
      const record = await TreatmentRecord.findById(req.params.id);
      if (!record) return res.status(404).json({ error: 'Not found' });
      
      if (record.status === 'Completed') {
         const hoursDiff = (new Date() - new Date(record.updatedAt)) / (1000 * 60 * 60);
         if (hoursDiff > 24) {
            return res.status(400).json({ error: 'Bệnh án đã khóa sổ sau 24h kể từ lúc hoàn tất, không thể sửa chữa' });
         }
      }
      next();
    } catch (err) {
      next(err);
    }
  }, validateTreatment, factory.updateOne(TreatmentRecord))
  .delete(authorize('Admin'), factory.deleteOne(TreatmentRecord));

module.exports = router;
