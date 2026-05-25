const express = require('express');
const { exportPayrollExcel } = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/payroll/export', protect, exportPayrollExcel);

module.exports = router;
