// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { 
    sendOTPValidator, 
    verifyOTPValidator, 
    selectRoleValidator 
} = require('../validators/validators');

// Public routes
router.post('/send-otp', validate(sendOTPValidator), authController.sendOTP);
router.post('/verify-otp', validate(verifyOTPValidator), authController.verifyOTP);
router.post('/resend-otp', validate(sendOTPValidator), authController.resendOTP);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.use(protect);
router.post('/select-role', validate(selectRoleValidator), authController.selectRole);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;