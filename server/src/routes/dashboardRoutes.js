const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getDashboardSummary);

module.exports = router;
