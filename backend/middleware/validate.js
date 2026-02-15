// middleware/validate.js
const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/ApiError');

// Validate request based on validation rules
const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        // Check for validation errors
        const errors = validationResult(req);
        
        if (errors.isEmpty()) {
            return next();
        }

        // Format errors
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
        }));

        throw new ApiError('Validation Error', 422, formattedErrors);
    };
};

module.exports = validate;