const express = require('express');
const { login, register, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);

module.exports = router;
