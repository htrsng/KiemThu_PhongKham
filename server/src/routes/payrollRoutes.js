const express = require('express');
const { calculateMonthlyPayroll, calculateYearlyPayroll, getPayrollSlip, savePayrollSlip, getShiftCoefficients, updateShiftCoefficient, updateAppointmentsDifficulty, getPayrollConfigHistory, addPayrollConfigHistory } = require('../controllers/payrollController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/monthly', protect, calculateMonthlyPayroll);
router.get('/yearly', protect, calculateYearlyPayroll);
router.get('/slip', protect, getPayrollSlip);
router.post('/save', protect, savePayrollSlip);

// UC 4.3 endpoints
router.get('/shifts/coefficients', protect, getShiftCoefficients);
router.put('/shifts/:id/coefficient', protect, updateShiftCoefficient);
router.put('/shifts/:id/appointments-difficulty', protect, updateAppointmentsDifficulty);

// UC 4.1 & 4.2 endpoints
router.get('/config-history', protect, getPayrollConfigHistory);
router.post('/config-history', protect, addPayrollConfigHistory);

module.exports = router;