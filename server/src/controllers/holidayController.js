const Holiday = require('../models/Holiday');

// @desc    Get all holidays
// @route   GET /api/holidays
// @access  Private
exports.getHolidays = async (req, res, next) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ data: holidays });
  } catch (error) {
    next(error);
  }
};
