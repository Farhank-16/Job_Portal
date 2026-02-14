// routes/index.js
const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const jobRoutes = require('./jobRoutes');
const skillRoutes = require('./skillRoutes');
const examRoutes = require('./examRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const paymentRoutes = require('./paymentRoutes');
const matchRoutes = require('./matchRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/skills', skillRoutes);
router.use('/exams', examRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes);
router.use('/match', matchRoutes);
router.use('/admin', adminRoutes);

// API info route
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Job Marketplace API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            jobs: '/api/v1/jobs',
            skills: '/api/v1/skills',
            exams: '/api/v1/exams',
            subscriptions: '/api/v1/subscriptions',
            payments: '/api/v1/payments',
            match: '/api/v1/match',
            admin: '/api/v1/admin'
        }
    });
});

module.exports = router;