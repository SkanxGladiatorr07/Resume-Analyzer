/**
 * Error Handler Utilities
 * Centralized error handling and formatting for API responses
 */

/**
 * Extract error message from API response
 * @param {Error} error - Error object from API call
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Network error
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your connection and try again.';
    }
    return 'Network error. Please check your internet connection.';
  }

  // HTTP error with response
  const { status, data } = error.response;

  // Handle specific status codes
  switch (status) {
    case 400:
      return data?.message || 'Invalid request. Please check your input.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return data?.message || 'The requested resource was not found.';
    case 409:
      return data?.message || 'This action conflicts with existing data.';
    case 422:
      return data?.message || 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Our team has been notified. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again in a few moments.';
    default:
      return data?.message || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Handle API error with logging
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {string} Error message
 */
export const handleApiError = (error, context = '') => {
  const message = getErrorMessage(error);
  
  // Log error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}] API Error:`, {
      message,
      status: error.response?.status,
      data: error.response?.data,
      error,
    });
  }

  return message;
};

/**
 * Check if error is authentication related
 * @param {Error} error - Error object
 * @returns {boolean} True if auth error
 */
export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};

/**
 * Check if error is network related
 * @param {Error} error - Error object
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  return !error.response || error.code === 'ECONNABORTED';
};

/**
 * Check if error is server related
 * @param {Error} error - Error object
 * @returns {boolean} True if server error
 */
export const isServerError = (error) => {
  const status = error.response?.status;
  return status >= 500 && status < 600;
};

/**
 * Format validation errors from API
 * @param {Object} error - Error object with validation errors
 * @returns {Object} Formatted validation errors
 */
export const formatValidationErrors = (error) => {
  const errors = error.response?.data?.errors || {};
  const formatted = {};

  Object.keys(errors).forEach((key) => {
    formatted[key] = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
  });

  return formatted;
};

/**
 * Retry failed request with exponential backoff
 * @param {Function} requestFn - Function that makes the request
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Request result
 */
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry on auth or validation errors
      if (isAuthError(error) || error.response?.status === 400 || error.response?.status === 422) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
};

/**
 * Error boundary handler
 * @param {Error} error - Error object
 * @param {Object} errorInfo - Error info from React
 */
export const logErrorToBoundary = (error, errorInfo) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Boundary Caught:', error, errorInfo);
  }
  
  // In production, you could send this to an error tracking service
  // Example: Sentry.captureException(error, { extra: errorInfo });
};

/**
 * Safe JSON parse with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parse fails
 * @returns {*} Parsed JSON or fallback
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error);
    return fallback;
  }
};

/**
 * Create error object with consistent structure
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {*} details - Additional error details
 * @returns {Object} Error object
 */
export const createError = (message, code = 'UNKNOWN_ERROR', details = null) => {
  return {
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
};

export default {
  getErrorMessage,
  handleApiError,
  isAuthError,
  isNetworkError,
  isServerError,
  formatValidationErrors,
  retryRequest,
  logErrorToBoundary,
  safeJsonParse,
  createError,
};
