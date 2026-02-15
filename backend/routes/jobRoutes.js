// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { protect, optionalAuth } = require('../middleware/auth');
const { employerOnly, employerOrAdmin } = require('../middleware/roleCheck');
const { setSearchRadius } = require('../middleware/subscriptionCheck');
const validate = require('../middleware/validate');
const { 
    createJobValidator, 
    updateJobValidator,
    searchJobsValidator 
} = require('../validators/validators');

// Public routes
router.get('/', validate(searchJobsValidator), jobController.getJobs);
router.get('/featured', jobController.getFeaturedJobs);
router.get('/recent', jobController.getRecentJobs);
router.get('/search/nearby', optionalAuth, setSearchRadius, jobController.searchNearbyJobs);
router.get('/:id', jobController.getJob);

// Protected routes
router.use(protect);

// Employer routes
router.post('/', employerOnly, validate(createJobValidator), jobController.createJob);
router.get('/my-jobs', employerOnly, jobController.getMyJobs);
router.put('/:id', employerOrAdmin, validate(updateJobValidator), jobController.updateJob);
router.delete('/:id', employerOrAdmin, jobController.deleteJob);
router.patch('/:id/status', employerOrAdmin, jobController.changeJobStatus);

module.exports = router;