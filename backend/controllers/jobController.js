// controllers/jobController.js
const { asyncHandler, paginate, createPaginationMeta } = require('../utils/helpers');
const { ApiError } = require('../utils/ApiError');
const JobModel = require('../models/Job');
const locationService = require('../services/locationService');
const matchingService = require('../services/matchingService');
const { SEARCH_RADIUS } = require('../utils/constants');

// @desc    Create job posting
// @route   POST /api/v1/jobs
// @access  Private (Employer)
exports.createJob = asyncHandler(async (req, res) => {
    if (req.user.role !== 'employer') {
        throw new ApiError('Only employers can create job postings', 403);
    }
    
    const job = await JobModel.create(req.user.id, req.body);
    
    // Generate AI matches in background
    setImmediate(async () => {
        try {
            const matches = await matchingService.findMatchesForJob(job.id);
            await matchingService.storeMatchResults(job.id, matches);
        } catch (error) {
            console.error('Error generating matches:', error);
        }
    });
    
    res.status(201).json({
        success: true,
        message: 'Job posted successfully',
        data: job
    });
});

// @desc    Get all jobs
// @route   GET /api/v1/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res) => {
    const { 
        keyword, job_type, salary_min, salary_max, skills,
        page = 1, limit = 10 
    } = req.query;
    
    const jobs = await JobModel.search({
        keyword,
        job_type,
        salary_min: salary_min ? parseFloat(salary_min) : null,
        salary_max: salary_max ? parseFloat(salary_max) : null,
        skills: skills ? skills.split(',').map(Number) : null
    }, parseInt(page), parseInt(limit));
    
    res.status(200).json({
        success: true,
        count: jobs.length,
        data: jobs
    });
});

// @desc    Get job by ID
// @route   GET /api/v1/jobs/:id
// @access  Public
exports.getJob = asyncHandler(async (req, res) => {
    const job = await JobModel.findById(req.params.id);
    
    if (!job) {
        throw new ApiError('Job not found', 404);
    }
    
    // Increment view count
    await JobModel.incrementViews(job.id);
    
    res.status(200).json({
        success: true,
        data: job
    });
});

// @desc    Update job
// @route   PUT /api/v1/jobs/:id
// @access  Private (Employer - Owner)
exports.updateJob = asyncHandler(async (req, res) => {
    let job = await JobModel.findById(req.params.id);
    
    if (!job) {
        throw new ApiError('Job not found', 404);
    }
    
    // Check ownership
    if (job.employer_id !== req.user.id && req.user.role !== 'admin') {
        throw new ApiError('Not authorized to update this job', 403);
    }
    
    job = await JobModel.update(req.params.id, req.body);
    
    res.status(200).json({
        success: true,
        message: 'Job updated successfully',
        data: job
    });
});

// @desc    Delete job
// @route   DELETE /api/v1/jobs/:id
// @access  Private (Employer - Owner)
exports.deleteJob = asyncHandler(async (req, res) => {
    const job = await JobModel.findById(req.params.id);
    
    if (!job) {
        throw new ApiError('Job not found', 404);
    }
    
    // Check ownership
    if (job.employer_id !== req.user.id && req.user.role !== 'admin') {
        throw new ApiError('Not authorized to delete this job', 403);
    }
    
    await JobModel.delete(req.params.id);
    
    res.status(200).json({
        success: true,
        message: 'Job deleted successfully'
    });
});

// @desc    Get employer's jobs
// @route   GET /api/v1/jobs/my-jobs
// @access  Private (Employer)
exports.getMyJobs = asyncHandler(async (req, res) => {
    if (req.user.role !== 'employer') {
        throw new ApiError('Only employers can access this', 403);
    }
    
    const { status, page = 1, limit = 10 } = req.query;
    
    const result = await JobModel.findByEmployer(
        req.user.id, 
        status, 
        parseInt(page), 
        parseInt(limit)
    );
    
    res.status(200).json({
        success: true,
        data: result.jobs,
        pagination: {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages
        }
    });
});

// @desc    Search jobs by location
// @route   GET /api/v1/jobs/search/nearby
// @access  Public
exports.searchNearbyJobs = asyncHandler(async (req, res) => {
    const { latitude, longitude, radius, keyword, job_type, salary_min } = req.query;
    
    if (!latitude || !longitude) {
        throw new ApiError('Latitude and longitude are required', 400);
    }
    
    // Determine search radius
    let searchRadius = parseInt(radius) || SEARCH_RADIUS.FREE;
    
    if (req.user) {
        const maxRadius = req.user.subscription_status === 'premium' 
            ? SEARCH_RADIUS.PREMIUM 
            : SEARCH_RADIUS.FREE;
        searchRadius = Math.min(searchRadius, maxRadius);
    } else {
        searchRadius = Math.min(searchRadius, SEARCH_RADIUS.FREE);
    }
    
    const jobs = await locationService.searchJobsNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        searchRadius,
        { keyword, jobType: job_type, minSalary: salary_min ? parseFloat(salary_min) : null }
    );
    
    res.status(200).json({
        success: true,
        count: jobs.length,
        searchRadius,
        data: jobs
    });
});

// @desc    Get featured jobs
// @route   GET /api/v1/jobs/featured
// @access  Public
exports.getFeaturedJobs = asyncHandler(async (req, res) => {
    const jobs = await JobModel.getFeatured(10);
    
    res.status(200).json({
        success: true,
        data: jobs
    });
});

// @desc    Get recent jobs
// @route   GET /api/v1/jobs/recent
// @access  Public
exports.getRecentJobs = asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;
    const jobs = await JobModel.getRecent(parseInt(limit));
    
    res.status(200).json({
        success: true,
        data: jobs
    });
});

// @desc    Change job status
// @route   PATCH /api/v1/jobs/:id/status
// @access  Private (Employer - Owner)
exports.changeJobStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    const job = await JobModel.findById(req.params.id);
    
    if (!job) {
        throw new ApiError('Job not found', 404);
    }
    
    if (job.employer_id !== req.user.id && req.user.role !== 'admin') {
        throw new ApiError('Not authorized', 403);
    }
    
    const updatedJob = await JobModel.update(req.params.id, { status });
    
    res.status(200).json({
        success: true,
        message: `Job status changed to ${status}`,
        data: updatedJob
    });
});