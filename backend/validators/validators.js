// validators/validators.js
const { body, param, query } = require('express-validator');
const { isValidMobile } = require('../utils/helpers');
const { ROLES, JOB_TYPES, AVAILABILITY, PROFICIENCY_LEVELS, PLAN_NAMES } = require('../utils/constants');

// ============================================
// AUTH VALIDATORS
// ============================================

const sendOTPValidator = [
    body('mobile')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .custom((value) => {
            if (!isValidMobile(value)) {
                throw new Error('Please provide a valid Indian mobile number');
            }
            return true;
        })
];

const verifyOTPValidator = [
    body('mobile')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .custom((value) => {
            if (!isValidMobile(value)) {
                throw new Error('Please provide a valid Indian mobile number');
            }
            return true;
        }),
    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
        .isNumeric().withMessage('OTP must contain only numbers')
];

const selectRoleValidator = [
    body('role')
        .trim()
        .notEmpty().withMessage('Role is required')
        .isIn([ROLES.EMPLOYER, ROLES.JOB_SEEKER]).withMessage('Invalid role selected')
];

// ============================================
// USER VALIDATORS
// ============================================

const updateProfileValidator = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('area')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Area must be less than 255 characters'),
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Bio must be less than 1000 characters'),
    body('expected_salary')
        .optional()
        .isFloat({ min: 0 }).withMessage('Expected salary must be a positive number'),
    body('availability')
        .optional()
        .isIn(Object.values(AVAILABILITY)).withMessage('Invalid availability status'),
    // Employer specific
    body('company_name')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Company name must be less than 200 characters'),
    body('company_description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Company description must be less than 2000 characters'),
    body('industry_type')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Industry type must be less than 100 characters'),
    body('website')
        .optional()
        .trim()
        .isURL().withMessage('Please provide a valid website URL')
];

const updateSkillsValidator = [
    body('skills')
        .isArray({ min: 1 }).withMessage('Please select at least one skill'),
    body('skills.*.skill_id')
        .isInt({ min: 1 }).withMessage('Invalid skill ID'),
    body('skills.*.proficiency_level')
        .optional()
        .isIn(Object.values(PROFICIENCY_LEVELS)).withMessage('Invalid proficiency level'),
    body('skills.*.years_of_experience')
        .optional()
        .isFloat({ min: 0, max: 50 }).withMessage('Years of experience must be between 0 and 50')
];

// ============================================
// JOB VALIDATORS
// ============================================

const createJobValidator = [
    body('title')
        .trim()
        .notEmpty().withMessage('Job title is required')
        .isLength({ min: 5, max: 200 }).withMessage('Job title must be between 5 and 200 characters'),
    body('description')
        .trim()
        .notEmpty().withMessage('Job description is required')
        .isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
    body('salary')
        .optional()
        .isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
    body('salary_min')
        .optional()
        .isFloat({ min: 0 }).withMessage('Minimum salary must be a positive number'),
    body('salary_max')
        .optional()
        .isFloat({ min: 0 }).withMessage('Maximum salary must be a positive number')
        .custom((value, { req }) => {
            if (req.body.salary_min && value < req.body.salary_min) {
                throw new Error('Maximum salary must be greater than minimum salary');
            }
            return true;
        }),
    body('job_type')
        .optional()
        .isIn(Object.values(JOB_TYPES)).withMessage('Invalid job type'),
    body('location')
        .trim()
        .notEmpty().withMessage('Job location is required')
        .isLength({ max: 255 }).withMessage('Location must be less than 255 characters'),
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('skills')
        .optional()
        .isArray().withMessage('Skills must be an array'),
    body('skills.*')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid skill ID')
];

const updateJobValidator = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid job ID'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 }).withMessage('Job title must be between 5 and 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
    body('status')
        .optional()
        .isIn(['draft', 'active', 'paused', 'closed']).withMessage('Invalid job status')
];

// ============================================
// SEARCH VALIDATORS
// ============================================

const searchJobsValidator = [
    query('keyword')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Search keyword too long'),
    query('location')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Location too long'),
    query('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('radius')
        .optional()
        .isInt({ min: 1, max: 500 }).withMessage('Radius must be between 1 and 500 km'),
    query('job_type')
        .optional()
        .isIn(Object.values(JOB_TYPES)).withMessage('Invalid job type'),
    query('salary_min')
        .optional()
        .isFloat({ min: 0 }).withMessage('Minimum salary must be positive'),
    query('salary_max')
        .optional()
        .isFloat({ min: 0 }).withMessage('Maximum salary must be positive'),
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const searchCandidatesValidator = [
    query('skills')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                const skills = value.split(',');
                return skills.every(s => !isNaN(parseInt(s)));
            }
            return true;
        }).withMessage('Invalid skills format'),
    query('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('radius')
        .optional()
        .isInt({ min: 1, max: 500 }).withMessage('Radius must be between 1 and 500 km'),
    query('availability')
        .optional()
        .isIn(Object.values(AVAILABILITY)).withMessage('Invalid availability'),
    query('verified_only')
        .optional()
        .isBoolean().withMessage('verified_only must be boolean')
];

// ============================================
// SUBSCRIPTION VALIDATORS
// ============================================

const createSubscriptionValidator = [
    body('plan')
        .trim()
        .notEmpty().withMessage('Plan is required')
        .isIn([PLAN_NAMES.PREMIUM_MONTHLY, PLAN_NAMES.PREMIUM_QUARTERLY, PLAN_NAMES.PREMIUM_YEARLY])
        .withMessage('Invalid subscription plan')
];

// ============================================
// PAYMENT VALIDATORS
// ============================================

const verifyPaymentValidator = [
    body('razorpay_order_id')
        .trim()
        .notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id')
        .trim()
        .notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature')
        .trim()
        .notEmpty().withMessage('Signature is required')
];

// ============================================
// EXAM VALIDATORS
// ============================================

const startExamValidator = [
    param('skillId')
        .isInt({ min: 1 }).withMessage('Invalid skill ID')
];

const submitExamValidator = [
    param('skillId')
        .isInt({ min: 1 }).withMessage('Invalid skill ID'),
    body('answers')
        .isArray({ min: 1 }).withMessage('Answers are required'),
    body('answers.*.question_id')
        .isInt({ min: 1 }).withMessage('Invalid question ID'),
    body('answers.*.selected_answer')
        .isIn(['A', 'B', 'C', 'D']).withMessage('Invalid answer option')
];

// ============================================
// ADMIN VALIDATORS
// ============================================

const banUserValidator = [
    param('userId')
        .isInt({ min: 1 }).withMessage('Invalid user ID'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Ban reason must be less than 500 characters')
];

const createSkillValidator = [
    body('skill_name')
        .trim()
        .notEmpty().withMessage('Skill name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Skill name must be between 2 and 100 characters'),
    body('category')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Category must be less than 100 characters')
];

const createExamQuestionValidator = [
    body('skill_id')
        .isInt({ min: 1 }).withMessage('Invalid skill ID'),
    body('question')
        .trim()
        .notEmpty().withMessage('Question is required')
        .isLength({ max: 1000 }).withMessage('Question must be less than 1000 characters'),
    body('option_a')
        .trim()
        .notEmpty().withMessage('Option A is required')
        .isLength({ max: 500 }).withMessage('Option A must be less than 500 characters'),
    body('option_b')
        .trim()
        .notEmpty().withMessage('Option B is required')
        .isLength({ max: 500 }).withMessage('Option B must be less than 500 characters'),
    body('option_c')
        .trim()
        .notEmpty().withMessage('Option C is required')
        .isLength({ max: 500 }).withMessage('Option C must be less than 500 characters'),
    body('option_d')
        .trim()
        .notEmpty().withMessage('Option D is required')
        .isLength({ max: 500 }).withMessage('Option D must be less than 500 characters'),
    body('correct_answer')
        .trim()
        .notEmpty().withMessage('Correct answer is required')
        .isIn(['A', 'B', 'C', 'D']).withMessage('Correct answer must be A, B, C, or D'),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level')
];

// ID Parameter Validator
const idParamValidator = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid ID')
];

module.exports = {
    sendOTPValidator,
    verifyOTPValidator,
    selectRoleValidator,
    updateProfileValidator,
    updateSkillsValidator,
    createJobValidator,
    updateJobValidator,
    searchJobsValidator,
    searchCandidatesValidator,
    createSubscriptionValidator,
    verifyPaymentValidator,
    startExamValidator,
    submitExamValidator,
    banUserValidator,
    createSkillValidator,
    createExamQuestionValidator,
    idParamValidator
};