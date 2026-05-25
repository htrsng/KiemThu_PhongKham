const express = require('express');
const { deductMaterials } = require('../controllers/inventoryController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/deduct', protect, deductMaterials);

module.exports = router;
