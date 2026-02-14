// utils/helpers.js
const crypto = require('crypto');

// Calculate Haversine distance between two points
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const toRad = (deg) => deg * (Math.PI / 180);

// Format mobile number
const formatMobile = (mobile) => {
    // Remove all non-digit characters
    let cleaned = mobile.replace(/\D/g, '');
    
    // Remove leading 91 or +91 if present
    if (cleaned.startsWith('91') && cleaned.length > 10) {
        cleaned = cleaned.substring(2);
    }
    
    // Return last 10 digits
    return cleaned.slice(-10);
};

// Validate Indian mobile number
const isValidMobile = (mobile) => {
    const cleaned = formatMobile(mobile);
    return /^[6-9]\d{9}$/.test(cleaned);
};

// Generate random string
const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

// Generate receipt number
const generateReceiptNumber = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = crypto.randomBytes(4).toString('hex');
    return `RCP_${timestamp}_${randomStr}`.toUpperCase();
};

// Paginate results
const paginate = (page = 1, limit = 10, maxLimit = 100) => {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(Math.max(1, parseInt(limit)), maxLimit);
    const offset = (pageNum - 1) * limitNum;
    
    return { page: pageNum, limit: limitNum, offset };
};

// Create pagination metadata
const createPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };
};

// Sanitize SQL LIKE query
const sanitizeLikeQuery = (query) => {
    if (!query) return '%';
    return `%${query.replace(/[%_]/g, '\\$&')}%`;
};

// Calculate expiry date
const calculateExpiryDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

// Check if date is expired
const isExpired = (date) => {
    if (!date) return true;
    return new Date(date) < new Date();
};

// Format date for MySQL
const formatDateForMySQL = (date) => {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
};

// Parse JSON safely
const safeJSONParse = (str, defaultValue = null) => {
    try {
        return JSON.parse(str);
    } catch {
        return defaultValue;
    }
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Remove sensitive fields from object
const sanitizeUser = (user) => {
    if (!user) return null;
    
    const { 
        otp, 
        password, 
        ...sanitized 
    } = user;
    
    return sanitized;
};

// Calculate match percentage
const calculateMatchPercentage = (matched, total) => {
    if (total === 0) return 0;
    return Math.round((matched / total) * 100);
};

// Slugify string
const slugify = (str) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Capitalize first letter
const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Format currency (INR)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
};

module.exports = {
    calculateHaversineDistance,
    formatMobile,
    isValidMobile,
    generateRandomString,
    generateReceiptNumber,
    paginate,
    createPaginationMeta,
    sanitizeLikeQuery,
    calculateExpiryDate,
    isExpired,
    formatDateForMySQL,
    safeJSONParse,
    asyncHandler,
    sanitizeUser,
    calculateMatchPercentage,
    slugify,
    capitalizeFirst,
    formatCurrency
};