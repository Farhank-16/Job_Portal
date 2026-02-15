// middleware/errorHandler.js
const { ApiError } = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // MySQL Duplicate Entry Error
    if (err.code === 'ER_DUP_ENTRY') {
        const field = err.message.match(/for key '(.+)'/)?.[1] || 'field';
        error = new ApiError(`Duplicate value for ${field}`, 409);
    }

    // MySQL Foreign Key Error
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        error = new ApiError('Referenced record not found', 400);
    }

    // MySQL Data Too Long Error
    if (err.code === 'ER_DATA_TOO_LONG') {
        error = new ApiError('Data too long for field', 400);
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError('Invalid token. Please log in again.', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new ApiError('Your session has expired. Please log in again.', 401);
    }

    // Validation Errors (express-validator)
    if (err.array && typeof err.array === 'function') {
        const errors = err.array();
        const formattedErrors = errors.map(e => ({
            field: e.path,
            message: e.msg
        }));
        error = new ApiError('Validation Error', 422, formattedErrors);
    }

    // Multer Errors (File Upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = new ApiError('File too large', 400);
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        error = new ApiError('Too many files', 400);
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = new ApiError('Unexpected file field', 400);
    }

    // Razorpay Errors
    if (err.error && err.error.code) {
        error = new ApiError(err.error.description || 'Payment error occurred', 400);
    }

    // Default to 500 server error
    const statusCode = error.statusCode || 500;
    const status = error.status || 'error';

    res.status(statusCode).json({
        success: false,
        status,
        message: error.message || 'Internal Server Error',
        errors: error.errors || null,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            originalError: err.message
        })
    });
};

module.exports = errorHandler;