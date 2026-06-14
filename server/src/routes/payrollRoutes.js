const express = require('express');
const { calculateMonthlyPayroll, calculateYearlyPayroll, getPayrollSlip, savePayrollSlip, deletePayrollSlip, approvePayrollSlip, payPayrollSlip, getShiftCoefficients, updateShiftCoefficient, updateAppointmentsDifficulty, getPayrollConfigHistory, addPayrollConfigHistory, deletePayrollConfigHistory } = require('../controllers/payrollController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

const allowSelfOrAdmin = (req, res, next) => {
    if (req.user.role === 'Admin') return next();
    if (req.user.role === 'Doctor') {
        if (req.query.doctorId !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Bạn chỉ được phép xem dữ liệu của chính mình.' });
        }
        return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
};

router.get('/monthly', protect, allowSelfOrAdmin, calculateMonthlyPayroll);
router.get('/yearly', protect, allowSelfOrAdmin, calculateYearlyPayroll);
router.get('/slip', protect, allowSelfOrAdmin, getPayrollSlip);

router.post('/save', protect, authorize('Admin'), savePayrollSlip);
router.delete('/slip/:id', protect, authorize('Admin'), deletePayrollSlip);
router.patch('/slip/:id/approve', protect, authorize('Admin'), approvePayrollSlip);
router.patch('/slip/:id/pay', protect, authorize('Admin'), payPayrollSlip);

// UC 4.3 endpoints
router.get('/shifts/coefficients', protect, authorize('Admin'), getShiftCoefficients);
router.put('/shifts/:id/coefficient', protect, authorize('Admin'), updateShiftCoefficient);
router.put('/shifts/:id/appointments-difficulty', protect, authorize('Admin'), updateAppointmentsDifficulty);

// UC 4.1 & 4.2 endpoints
router.get('/config-history', protect, authorize('Admin'), getPayrollConfigHistory);
router.post('/config-history', protect, authorize('Admin'), addPayrollConfigHistory);
router.delete('/config-history/:id', protect, authorize('Admin'), deletePayrollConfigHistory);

module.exports = router;