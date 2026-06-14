const express = require('express');
const factory = require('../controllers/handlerFactory');
const Invoice = require('../models/Invoice');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

// Only Admin and Receptionist can access Invoice
router.use(authorize('Admin', 'Reception'));

async function validateInvoice(req, res, next) {
   if (req.body.amountPaid !== undefined && req.body.amountPaid < 0) {
      return res.status(400).json({ error: 'Số tiền nhận không được là số âm' });
   }
   
   if (req.body.status === 'Hoàn tiền' && req.params.id) {
      const existing = await Invoice.findById(req.params.id);
      if (existing && existing.status === 'Đã thanh toán') {
         const daysDiff = (new Date() - new Date(existing.updatedAt)) / (1000 * 60 * 60 * 24);
         if (daysDiff > 7) {
            return res.status(400).json({ error: 'Đã hết hạn hoàn tiền (quá 7 ngày kể từ khi thanh toán)' });
         }
      }
   }
   
   if (req.body.amountPaid !== undefined && req.body.finalAmount !== undefined) {
      if (req.body.amountPaid < req.body.finalAmount && req.body.allowDebt !== true) {
         return res.status(400).json({ error: 'Số tiền nhận không đủ. Vui lòng xác nhận Ghi nợ nếu muốn tiếp tục.' });
      }
      if (req.body.allowDebt === true && req.body.amountPaid < req.body.finalAmount) {
         req.body.debt = req.body.finalAmount - req.body.amountPaid;
      } else {
         req.body.debt = 0;
      }
   }

   next();
}

router.route('/')
  .get(factory.getAll(Invoice))
  .post(validateInvoice, factory.createOne(Invoice));

router.route('/:id')
  .get(factory.getOne(Invoice))
  .put(validateInvoice, factory.updateOne(Invoice))
  .patch(validateInvoice, factory.updateOne(Invoice))
  .delete(authorize('Admin'), factory.deleteOne(Invoice));

module.exports = router;
