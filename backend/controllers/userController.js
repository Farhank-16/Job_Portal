// controllers/userController.js
const { asyncHandler, paginate, createPaginationMeta } = require('../utils/helpers');
const { ApiError } = require('../utils/ApiError');
const UserModel = require('../models/User');
const SkillModel = require('../models/Skill');
const locationService = require('../services/locationService');
const { SEARCH_RADIUS } = require('../utils/constants');

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
    const user = await UserModel.getUserWithSkills(req.user.id);
    
    if (!user) {
        throw new ApiError('User not found', 404);
    }
    
    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
    const allowedFields = [
        'name', 'area', 'latitude', 'longitude', 'profile_image',
        'availability', 'expected_salary', 'bio',
        'company_name', 'company_description', 'industry_type',
        'company_size', 'website', 'contact_person_name'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });
    
    const user = await UserModel.update(req.user.id, updateData);
    
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
    });
});

// @desc    Update user skills
// @route   PUT /api/v1/users/skills
// @access  Private (Job Seeker)
exports.updateSkills = asyncHandler(async (req, res) => {
    const { skills } = req.body;
    
    if (req.user.role !== 'job_seeker') {
        throw new ApiError('Only job seekers can update skills', 403);
    }
    
    const updatedSkills = await SkillModel.updateUserSkills(req.user.id, skills);
    
    res.status(200).json({
        success: true,
        message: 'Skills updated successfully',
        data: updatedSkills
    });
});

// @desc    Get user skills
// @route   GET /api/v1/users/skills
// @access  Private
exports.getSkills = asyncHandler(async (req, res) => {
    const skills = await SkillModel.getUserSkills(req.user.id);
    
    res.status(200).json({
        success: true,
        data: skills
    });
});

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUserById = asyncHandler(async (req, res) => {
    const user = await UserModel.getUserWithSkills(req.params.id);
    
    if (!user) {
        throw new ApiError('User not found', 404);
    }
    
    // Remove sensitive data for other users
    if (user.id !== req.user.id && req.user.role !== 'admin') {
        delete user.mobile;
    }
    
    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Search job seekers (for employers)
// @route   GET /api/v1/users/search/candidates
// @access  Private (Employer/Admin)
exports.searchCandidates = asyncHandler(async (req, res) => {
    if (!['employer', 'admin'].includes(req.user.role)) {
        throw new ApiError('Only employers can search candidates', 403);
    }
    
    const { 
        skills, latitude, longitude, radius, 
        availability, verified_only, keyword,
        page = 1, limit = 10 
    } = req.query;
    
    // Determine search radius based on subscription
    const isPremium = req.user.subscription_status === 'premium';
    const maxRadius = isPremium ? SEARCH_RADIUS.PREMIUM : SEARCH_RADIUS.FREE;
    const searchRadius = Math.min(parseInt(radius) || maxRadius, maxRadius);
    
    let candidates;
    
    if (latitude && longitude) {
        // Location-based search
        const filters = {
            skills: skills ? skills.split(',').map(Number) : null,
            availability,
            verifiedOnly: verified_only === 'true',
            keyword
        };
        
        candidates = await locationService.searchJobSeekersNearby(
            parseFloat(latitude),
            parseFloat(longitude),
            searchRadius,
            filters
        );
    } else {
        // Regular search
        candidates = await UserModel.search({
            skills: skills ? skills.split(',').map(Number) : null,
            availability,
            verified: verified_only === 'true',
            keyword
        }, parseInt(page), parseInt(limit));
    }
    
    res.status(200).json({
        success: true,
        data: {
            candidates,
            searchRadius,
            isPremium
        }
    });
});

// @desc    Get nearby candidates
// @route   GET /api/v1/users/nearby
// @access  Private (Employer)
exports.getNearbyCandidates = asyncHandler(async (req, res) => {
    if (req.user.role !== 'employer') {
        throw new ApiError('Only employers can access this', 403);
    }
    
    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
        throw new ApiError('Latitude and longitude are required', 400);
    }
    
    // Check subscription for radius
    const isPremium = req.user.subscription_status === 'premium';
    const searchRadius = isPremium ? SEARCH_RADIUS.PREMIUM : SEARCH_RADIUS.FREE;
    
    const candidates = await locationService.searchJobSeekersNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        searchRadius,
        { verifiedOnly: false }
    );
    
    res.status(200).json({
        success: true,
        data: {
            candidates,
            searchRadius,
            count: candidates.length
        }
    });
});

// @desc    Upload profile image
// @route   POST /api/v1/users/profile/image
// @access  Private
exports.uploadProfileImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError('Please upload an image', 400);
    }
    
    // In production, upload to cloud storage (Cloudinary, S3, etc.)
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    
    const user = await UserModel.update(req.user.id, {
        profile_image: imageUrl
    });
    
    res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
            imageUrl: user.profile_image
        }
    });
});

// @desc    Get subscription details
// @route   GET /api/v1/users/subscription
// @access  Private
exports.getSubscriptionDetails = asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user.id);
    
    res.status(200).json({
        success: true,
        data: {
            status: user.subscription_status,
            expiry: user.subscription_expiry,
            isPremium: user.subscription_status === 'premium',
            features: {
                searchRadius: user.subscription_status === 'premium' 
                    ? SEARCH_RADIUS.PREMIUM 
                    : SEARCH_RADIUS.FREE,
                aiMatchAccess: user.subscription_status === 'premium',
                priorityListing: user.subscription_status === 'premium'
            }
        }
    });
});