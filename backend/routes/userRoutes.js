// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');
const { requireRole, employerOrAdmin } = require('../middleware/roleCheck');
const { setSearchRadius } = require('../middleware/subscriptionCheck');
const validate = require('../middleware/validate');
const { 
    updateProfileValidator, 
    updateSkillsValidator,
    searchCandidatesValidator 
} = require('../validators/validators');

// File upload middleware
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// Protected routes
router.use(protect);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileValidator), userController.updateProfile);
router.post('/profile/image', upload.single('image'), userController.uploadProfileImage);

// Skills routes
router.get('/skills', userController.getSkills);
router.put('/skills', validate(updateSkillsValidator), userController.updateSkills);

// Subscription
router.get('/subscription', userController.getSubscriptionDetails);

// Search candidates (employers only)
router.get('/search/candidates', 
    employerOrAdmin, 
    setSearchRadius,
    validate(searchCandidatesValidator), 
    userController.searchCandidates
);

// Nearby candidates
router.get('/nearby', setSearchRadius, userController.getNearbyCandidates);

// Get user by ID
router.get('/:id', userController.getUserById);

module.exports = router;