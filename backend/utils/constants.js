// utils/constants.js

// User Roles
const ROLES = {
    ADMIN: 'admin',
    EMPLOYER: 'employer',
    JOB_SEEKER: 'job_seeker'
};

// Subscription Status
const SUBSCRIPTION_STATUS = {
    FREE: 'free',
    PREMIUM: 'premium'
};

// Subscription Plans
const PLAN_NAMES = {
    FREE: 'free',
    PREMIUM_MONTHLY: 'premium_monthly',
    PREMIUM_QUARTERLY: 'premium_quarterly',
    PREMIUM_YEARLY: 'premium_yearly'
};

// Job Types
const JOB_TYPES = {
    FULL_TIME: 'full_time',
    PART_TIME: 'part_time',
    CONTRACT: 'contract',
    FREELANCE: 'freelance',
    INTERNSHIP: 'internship'
};

// Job Status
const JOB_STATUS = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    CLOSED: 'closed',
    EXPIRED: 'expired'
};

// Application Status
const APPLICATION_STATUS = {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    SHORTLISTED: 'shortlisted',
    INTERVIEWED: 'interviewed',
    OFFERED: 'offered',
    HIRED: 'hired',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn'
};

// Payment Status
const PAYMENT_STATUS = {
    CREATED: 'created',
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled'
};

// Availability Types
const AVAILABILITY = {
    IMMEDIATE: 'immediate',
    WITHIN_WEEK: 'within_week',
    WITHIN_MONTH: 'within_month',
    NOT_AVAILABLE: 'not_available'
};

// Proficiency Levels
const PROFICIENCY_LEVELS = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert'
};

// Company Sizes
const COMPANY_SIZES = {
    MICRO: '1-10',
    SMALL: '11-50',
    MEDIUM: '51-200',
    LARGE: '201-500',
    ENTERPRISE: '500+'
};

// Search Radius (in km)
const SEARCH_RADIUS = {
    FREE: parseInt(process.env.FREE_SEARCH_RADIUS_KM) || 10,
    PREMIUM: parseInt(process.env.PREMIUM_SEARCH_RADIUS_KM) || 100
};

// Exam Settings
const EXAM_SETTINGS = {
    PASSING_SCORE: parseInt(process.env.EXAM_PASSING_SCORE) || 60,
    QUESTIONS_COUNT: parseInt(process.env.EXAM_QUESTIONS_COUNT) || 10,
    TIME_LIMIT_MINUTES: parseInt(process.env.EXAM_TIME_LIMIT_MINUTES) || 15
};

// OTP Settings
const OTP_SETTINGS = {
    LENGTH: 6,
    EXPIRY_MINUTES: parseInt(process.env.MSG91_OTP_EXPIRY) || 5,
    MAX_ATTEMPTS: 3,
    RESEND_COOLDOWN_SECONDS: 60
};

// Pagination Defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// Notification Types
const NOTIFICATION_TYPES = {
    JOB_MATCH: 'job_match',
    APPLICATION: 'application',
    SUBSCRIPTION: 'subscription',
    EXAM: 'exam',
    SYSTEM: 'system',
    PROMOTION: 'promotion'
};

// Match Score Weights
const MATCH_WEIGHTS = {
    SKILL: 0.40,
    LOCATION: 0.25,
    SALARY: 0.20,
    AVAILABILITY: 0.10,
    EXPERIENCE: 0.05
};

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500
};

module.exports = {
    ROLES,
    SUBSCRIPTION_STATUS,
    PLAN_NAMES,
    JOB_TYPES,
    JOB_STATUS,
    APPLICATION_STATUS,
    PAYMENT_STATUS,
    AVAILABILITY,
    PROFICIENCY_LEVELS,
    COMPANY_SIZES,
    SEARCH_RADIUS,
    EXAM_SETTINGS,
    OTP_SETTINGS,
    PAGINATION,
    NOTIFICATION_TYPES,
    MATCH_WEIGHTS,
    HTTP_STATUS
};