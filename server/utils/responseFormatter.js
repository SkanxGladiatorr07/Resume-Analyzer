/**
 * Response Formatter Utility
 * Provides consistent API response formats across all endpoints
 */

/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} meta - Additional metadata
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...meta,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} errors - Detailed error information
 */
export const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Created resource response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {String} message - Success message
 */
export const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * No content response (successful deletion)
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 */
export const sendNoContent = (res, message = 'Resource deleted successfully') => {
  return res.status(200).json({
    success: true,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Paginated response formatter
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 * @param {String} message - Success message
 */
export const sendPaginated = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  
  return sendSuccess(res, data, message, 200, {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Object|Array} errors - Validation errors
 */
export const sendValidationError = (res, errors) => {
  return sendError(res, 'Validation failed', 400, errors);
};

/**
 * Unauthorized error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(res, message, 401);
};

/**
 * Forbidden error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export const sendForbidden = (res, message = 'Access forbidden') => {
  return sendError(res, message, 403);
};

/**
 * Not found error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, 404);
};

/**
 * Conflict error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export const sendConflict = (res, message = 'Resource conflict') => {
  return sendError(res, message, 409);
};

/**
 * Rate limit error response
 * @param {Object} res - Express response object
 * @param {Number} retryAfter - Seconds until retry allowed
 */
export const sendRateLimitError = (res, retryAfter = null) => {
  const response = {
    success: false,
    message: 'Too many requests. Please try again later.',
    ...(retryAfter && { retryAfter }),
    timestamp: new Date().toISOString(),
  };
  
  return res.status(429).json(response);
};

/**
 * Server error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export const sendServerError = (res, message = 'Internal server error') => {
  return sendError(res, message, 500);
};

/**
 * Accepted response (for async processing)
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message
 */
export const sendAccepted = (res, data = null, message = 'Request accepted for processing') => {
  return sendSuccess(res, data, message, 202);
};

/**
 * Bad request error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Object} errors - Detailed errors
 */
export const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  return sendError(res, message, 400, errors);
};

/**
 * Response formatter class for chainable methods
 */
export class ResponseFormatter {
  constructor(res) {
    this.res = res;
  }

  success(data, message, statusCode = 200, meta = {}) {
    return sendSuccess(this.res, data, message, statusCode, meta);
  }

  error(message, statusCode = 500, errors = null) {
    return sendError(this.res, message, statusCode, errors);
  }

  created(data, message) {
    return sendCreated(this.res, data, message);
  }

  noContent(message) {
    return sendNoContent(this.res, message);
  }

  paginated(data, page, limit, total, message) {
    return sendPaginated(this.res, data, page, limit, total, message);
  }

  validationError(errors) {
    return sendValidationError(this.res, errors);
  }

  unauthorized(message) {
    return sendUnauthorized(this.res, message);
  }

  forbidden(message) {
    return sendForbidden(this.res, message);
  }

  notFound(message) {
    return sendNotFound(this.res, message);
  }

  conflict(message) {
    return sendConflict(this.res, message);
  }

  serverError(message) {
    return sendServerError(this.res, message);
  }
}

/**
 * Middleware to attach response formatter to res object
 */
export const attachFormatter = (req, res, next) => {
  res.formatter = new ResponseFormatter(res);
  next();
};

export default {
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendPaginated,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendRateLimitError,
  sendServerError,
  sendAccepted,
  sendBadRequest,
  ResponseFormatter,
  attachFormatter,
};
