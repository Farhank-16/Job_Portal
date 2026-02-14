// controllers/authController.js
const { asyncHandler } = require('../utils/helpers');
const { ApiError } = require('../utils/ApiError');
const { formatMobile } = require('../utils/helpers');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const otpService = require('../services/otpService');
const UserModel = require('../models/User');

// @desc    Send OTP
// @route   POST /api/v1/auth/send-otp
// @access  Public
exports.sendOTP = asyncHandler(async (req, res) => {
    const { mobile } = req.body;
    
    const result = await otpService.sendOTP(mobile);
    
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            expiresIn: result.expiresIn
        }
    });
});

// @desc    Verify OTP and Login
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res) => {
    const { mobile, otp } = req.body;
    
    // Verify OTP
    await otpService.verifyOTP(mobile, otp);
    
    const formattedMobile = formatMobile(mobile);
    
    // Check if user exists
    let user = await UserModel.findByMobile(formattedMobile);
    let isNewUser = false;
    
    if (!user) {
        // Create new user
        user = await UserModel.create({ mobile: formattedMobile });
        isNewUser = true;
    }
    
    // Update last login
    await UserModel.updateLastLogin(user.id);
    
    // Generate tokens
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    
    res.status(200).json({
        success: true,
        message: isNewUser ? 'Account created successfully' : 'Login successful',
        data: {
            user,
            token,
            refreshToken,
            isNewUser,
            needsRoleSelection: !user.role,
            needsProfileCompletion: !user.name
        }
    });
});

// @desc    Resend OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
exports.resendOTP = asyncHandler(async (req, res) => {
    const { mobile } = req.body;
    
    const result = await otpService.resendOTP(mobile);
    
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            expiresIn: result.expiresIn || 300
        }
    });
});

// @desc    Select Role
// @route   POST /api/v1/auth/select-role
// @access  Private
exports.selectRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const userId = req.user.id;
    
    // Check if role is already set
    if (req.user.role) {
        throw new ApiError('Role has already been selected', 400);
    }
    
    // Update user role
    const user = await UserModel.updateRole(userId, role);
    
    // Generate new token with role
    const token = generateToken(user.id, user.role);
    
    res.status(200).json({
        success: true,
        message: 'Role selected successfully',
        data: {
            user,
            token
        }
    });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
    const user = await UserModel.getUserWithSkills(req.user.id);
    
    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Refresh Token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        throw new ApiError('Refresh token is required', 400);
    }
    
    const { verifyRefreshToken } = require('../middleware/auth');
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
        throw new ApiError('Invalid or expired refresh token', 401);
    }
    
    const user = await UserModel.findById(decoded.id);
    if (!user) {
        throw new ApiError('User not found', 404);
    }
    
    const newToken = generateToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);
    
    res.status(200).json({
        success: true,
        data: {
            token: newToken,
            refreshToken: newRefreshToken
        }
    });
});

// @desc    Logout
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
    // In a production app, you might want to blacklist the token
    // For now, just return success
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});