// utils/ApiError.js
class ApiError extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Common error factory methods
const createError = {
    badRequest: (message = 'Bad Request', errors = null) => {
        return new ApiError(message, 400, errors);
    },
    
    unauthorized: (message = 'Unauthorized') => {
        return new ApiError(message, 401);
    },
    
    forbidden: (message = 'Forbidden') => {
        return new ApiError(message, 403);
    },
    
    notFound: (message = 'Not Found') => {
        return new ApiError(message, 404);
    },
    
    conflict: (message = 'Conflict') => {
        return new ApiError(message, 409);
    },
    
    tooManyRequests: (message = 'Too Many Requests') => {
        return new ApiError(message, 429);
    },
    
    internal: (message = 'Internal Server Error') => {
        return new ApiError(message, 500);
    },
    
    validation: (errors) => {
        return new ApiError('Validation Error', 422, errors);
    }
};

module.exports = { ApiError, createError };