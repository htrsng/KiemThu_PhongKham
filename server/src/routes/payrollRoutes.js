const express = require('express');
const { calculateMonthlyPayroll, calculateYearlyPayroll } = require('../controllers/payrollController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/monthly', protect, calculateMonthlyPayroll);
router.get('/yearly', protect, calculateYearlyPayroll);

module.exports = router;