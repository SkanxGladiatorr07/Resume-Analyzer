/**
 * Validator Middleware Factory
 * Creates middleware functions for request validation using Joi schemas
 */

import { sendValidationError } from '../utils/responseFormatter.js';

/**
 * Validation targets
 */
export const ValidateTarget = {
  BODY: 'body',
  QUERY: 'query',
  PARAMS: 'params',
};

/**
 * Create validation middleware
 * @param {Object} schema - Joi validation schema
 * @param {String} target - Target to validate (body, query, params)
 * @returns {Function} Express middleware
 */
export const validate = (schema, target = ValidateTarget.BODY) => {
  return (req, res, next) => {
    const dataToValidate = req[target];

    // Validate data against schema
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert values to correct types
    });

    // If validation fails, return error response
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return sendValidationError(res, errors);
    }

    // Replace request data with validated and sanitized data
    req[target] = value;
    next();
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema) => validate(schema, ValidateTarget.BODY);

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => validate(schema, ValidateTarget.QUERY);

/**
 * Validate route parameters
 */
export const validateParams = (schema) => validate(schema, ValidateTarget.PARAMS);

/**
 * Validate multiple targets at once
 */
export const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    // Validate each target
    for (const [target, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      const dataToValidate = req[target];
      const { error } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        const targetErrors = error.details.map((detail) => ({
          target,
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type,
        }));
        errors.push(...targetErrors);
      }
    }

    // If any validation fails, return error response
    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    next();
  };
};

/**
 * Optional validation - doesn't fail if data is missing
 */
export const validateOptional = (schema, target = ValidateTarget.BODY) => {
  return (req, res, next) => {
    const dataToValidate = req[target];

    // Skip validation if no data provided
    if (!dataToValidate || Object.keys(dataToValidate).length === 0) {
      return next();
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return sendValidationError(res, errors);
    }

    req[target] = value;
    next();
  };
};

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateMultiple,
  validateOptional,
  ValidateTarget,
};
