/**
 * Response Utilities
 * Standardized response formatting for consistent API responses
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Express response
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Success response with pagination
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination object
 * @param {string} message - Success message
 * @returns {Object} Express response
 */
export const sendSuccessWithPagination = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Additional error details (only in development)
 * @returns {Object} Express response
 */
export const sendError = (res, message, statusCode = 500, details = null) => {
  const response = {
    success: false,
    message,
  };

  // Include details only in development
  if (process.env.NODE_ENV === 'development' && details) {
    response.error = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array|string} errors - Validation errors
 * @returns {Object} Express response
 */
export const sendValidationError = (res, errors) => {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errorArray,
  });
};

/**
 * Not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 * @returns {Object} Express response
 */
export const sendNotFound = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`,
  });
};

/**
 * Unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 * @returns {Object} Express response
 */
export const sendUnauthorized = (res, message = 'Not authorized to access this resource') => {
  return res.status(403).json({
    success: false,
    message,
  });
};

/**
 * Conflict error response (409)
 * @param {Object} res - Express response object
 * @param {string} message - Conflict message
 * @returns {Object} Express response
 */
export const sendConflict = (res, message) => {
  return res.status(409).json({
    success: false,
    message,
  });
};

/**
 * Service unavailable response (503)
 * @param {Object} res - Express response object
 * @param {string} service - Service name
 * @returns {Object} Express response
 */
export const sendServiceUnavailable = (res, service = 'Service') => {
  return res.status(503).json({
    success: false,
    message: `${service} is temporarily unavailable. Please try again later.`,
  });
};

/**
 * Processing response (202)
 * @param {Object} res - Express response object
 * @param {Object} data - Processing status data
 * @param {string} message - Processing message
 * @returns {Object} Express response
 */
export const sendProcessing = (res, data, message = 'Processing') => {
  return res.status(202).json({
    success: true,
    status: 'processing',
    message,
    data,
  });
};

/**
 * Handle error and send appropriate response
 * Automatically determines status code from error object
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default error message if none in error
 * @returns {Object} Express response
 */
export const handleError = (res, error, defaultMessage = 'An error occurred') => {
  const statusCode = error.statusCode || 500;
  const message = error.message || defaultMessage;
  
  return sendError(res, message, statusCode, error);
};

/**
 * Create pagination object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination object
 */
export const createPagination = (page, limit, total) => {
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
    hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
    hasPrev: parseInt(page) > 1,
  };
};
