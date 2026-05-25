const express = require('express');
const { getHolidays } = require('../controllers/holidayController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getHolidays);

module.exports = router;
