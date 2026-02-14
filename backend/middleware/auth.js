// middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');

// Protect routes - Verify JWT token
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        throw new ApiError('Not authorized. Please log in.', 401);
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const [user] = await query(
            `SELECT id, name, mobile, role, subscription_status, subscription_expiry, 
                    exam_verified, badge_verified, is_active, is_banned
             FROM users WHERE id = ?`,
            [decoded.id]
        );

        // Check if user exists
        if (!user) {
            throw new ApiError('User no longer exists.', 401);
        }

        // Check if user is banned
        if (user.is_banned) {
            throw new ApiError('Your account has been banned. Please contact support.', 403);
        }

        // Check if user is active
        if (!user.is_active) {
            throw new ApiError('Your account is inactive. Please contact support.', 403);
        }

        // Attach user to request
        req.user = user;
        next();

    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error.name === 'TokenExpiredError') {
            throw new ApiError('Session expired. Please log in again.', 401);
        }
        throw new ApiError('Not authorized. Invalid token.', 401);
    }
});

// Optional auth - Don't throw error if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const [user] = await query(
                `SELECT id, name, mobile, role, subscription_status, subscription_expiry, 
                        exam_verified, badge_verified, is_active, is_banned
                 FROM users WHERE id = ? AND is_active = TRUE AND is_banned = FALSE`,
                [decoded.id]
            );
            req.user = user || null;
        } catch {
            req.user = null;
        }
    } else {
        req.user = null;
    }

    next();
});

// Generate JWT Token
const generateToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
        return null;
    }
};

module.exports = {
    protect,
    optionalAuth,
    generateToken,
    generateRefreshToken,
    verifyRefreshToken
};