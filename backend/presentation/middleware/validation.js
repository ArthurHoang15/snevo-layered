// ✅ Request Validation Middleware - Presentation Layer
// Handles request validation and sanitization

import { ValidationError } from '../../infrastructure/errors/ErrorClasses.js';

class ValidationMiddleware {
    constructor() {
        // Initialize validation middleware
    }

    /**
     * Validate request body against schema
     */
    validateBody(schema) {
        return (req, res) => {
            const errors = this._validate(req.body || {}, schema);
            if (errors.length > 0) {
                throw new ValidationError('Request body validation failed', errors);
            }
            return true;
        };
    }

    /**
     * Validate request parameters
     */
    validateParams(schema) {
        return (req, res) => {
            const errors = this._validate(req.params || {}, schema);
            if (errors.length > 0) {
                throw new ValidationError('Request params validation failed', errors);
            }
            return true;
        };
    }

    /**
     * Validate request query parameters
     */
    validateQuery(schema) {
        return (req, res) => {
            const errors = this._validate(req.query || {}, schema);
            if (errors.length > 0) {
                throw new ValidationError('Request query validation failed', errors);
            }
            return true;
        };
    }

    /**
     * Validate data against schema rules
     */
    _validate(data, schema) {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];

            // Required check
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push({ field, message: `${field} is required` });
                continue;
            }

            // Skip if not required and not present
            if (value === undefined || value === null) continue;

            // Type check
            if (rules.type) {
                const typeValid = this._checkType(value, rules.type);
                if (!typeValid) {
                    errors.push({ field, message: `${field} must be of type ${rules.type}` });
                }
            }

            // Min length
            if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
                errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
            }

            // Max length
            if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
                errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
            }

            // Min value
            if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
                errors.push({ field, message: `${field} must be at least ${rules.min}` });
            }

            // Max value
            if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
                errors.push({ field, message: `${field} must be at most ${rules.max}` });
            }

            // Pattern
            if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
                errors.push({ field, message: `${field} format is invalid` });
            }
        }

        return errors;
    }

    _checkType(value, expectedType) {
        switch (expectedType) {
            case 'string': return typeof value === 'string';
            case 'number': return typeof value === 'number' && !isNaN(value);
            case 'integer': return Number.isInteger(value);
            case 'boolean': return typeof value === 'boolean';
            case 'array': return Array.isArray(value);
            case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
            default: return true;
        }
    }
}

export default new ValidationMiddleware();
