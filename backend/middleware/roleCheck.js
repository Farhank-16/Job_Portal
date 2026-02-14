// middleware/roleCheck.js
const { ApiError } = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

// Restrict to specific roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new ApiError('Not authorized. Please log in.', 401);
        }

        if (!roles.includes(req.user.role)) {
            throw new ApiError(
                `You do not have permission to perform this action. Required role: ${roles.join(' or ')}`,
                403
            );
        }

        next();
    };
};

// Admin only
const adminOnly = restrictTo(ROLES.ADMIN);

// Employer only
const employerOnly = restrictTo(ROLES.EMPLOYER);

// Job Seeker only
const jobSeekerOnly = restrictTo(ROLES.JOB_SEEKER);

// Employer or Admin
const employerOrAdmin = restrictTo(ROLES.EMPLOYER, ROLES.ADMIN);

// Job Seeker or Admin
const jobSeekerOrAdmin = restrictTo(ROLES.JOB_SEEKER, ROLES.ADMIN);

// Check if role is selected
const requireRole = (req, res, next) => {
    if (!req.user) {
        throw new ApiError('Not authorized. Please log in.', 401);
    }

    if (!req.user.role) {
        throw new ApiError('Please select your role first.', 400);
    }

    next();
};

// Check if profile is complete
const requireCompleteProfile = (req, res, next) => {
    if (!req.user) {
        throw new ApiError('Not authorized. Please log in.', 401);
    }

    if (!req.user.name) {
        throw new ApiError('Please complete your profile first.', 400);
    }

    next();
};

module.exports = {
    restrictTo,
    adminOnly,
    employerOnly,
    jobSeekerOnly,
    employerOrAdmin,
    jobSeekerOrAdmin,
    requireRole,
    requireCompleteProfile
};