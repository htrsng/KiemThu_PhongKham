const express = require('express');
const { exportPayrollExcel } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');
const Invoice = require('../models/Invoice');

const router = express.Router();

router.get('/payroll/export', protect, authorize('Admin'), exportPayrollExcel);

router.get('/revenue', protect, authorize('Admin'), async (req, res, next) => {
    try {
        const { startDate, endDate, doctorId } = req.query;
        
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
           return res.status(400).json({ error: 'Ngày bắt đầu không được lớn hơn ngày kết thúc' });
        }
        
        if (endDate && new Date(endDate) > new Date()) {
           return res.status(400).json({ error: 'Không thể xem báo cáo cho khoảng thời gian trong tương lai' });
        }

        const filter = { status: 'Đã thanh toán' };
        
        if (startDate || endDate) {
            filter.updatedAt = {};
            if (startDate) filter.updatedAt.$gte = new Date(startDate);
            if (endDate) filter.updatedAt.$lte = new Date(endDate);
        }
        if (doctorId) filter.doctorId = doctorId;

        const invoices = await Invoice.find(filter);
        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || inv.finalAmount || 0), 0);

        res.json({ data: { totalRevenue, invoices: invoices.map(i => i.toJSON()) } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
