const express = require('express');
const router = express.Router();
const { register, login, getMe, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, oauthLimiter } = require('../middleware/rateLimiter');

// Apply validation middleware and rate limiting
router.post('/register', authLimiter, register.validation, register);
router.post('/login', authLimiter, login.validation, login);
router.post('/google', oauthLimiter, googleAuth); // Use more lenient limiter for OAuth
router.get('/me', protect, getMe);

module.exports = router;
