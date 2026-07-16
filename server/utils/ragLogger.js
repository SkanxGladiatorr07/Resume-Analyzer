/**
 * RAG Logger Utility
 * Centralized logging for RAG operations (chunking, embedding, vector operations)
 * 
 * @module utils/ragLogger
 */

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
};

/**
 * Log colors for console output
 */
const LogColors = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[34m', // Blue
  WARN: '\x1b[33m', // Yellow
  ERROR: '\x1b[31m', // Red
  SUCCESS: '\x1b[32m', // Green
  RESET: '\x1b[0m',
};

/**
 * Log icons
 */
const LogIcons = {
  DEBUG: '🔍',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  SUCCESS: '✅',
};

/**
 * Format timestamp
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Format log message
 * 
 * @param {string} level - Log level
 * @param {string} operation - Operation name (chunking, embedding, vector, search)
 * @param {string} message - Log message
 * @param {Object} [metadata={}] - Additional metadata
 * @returns {string} Formatted log message
 */
const formatLogMessage = (level, operation, message, metadata = {}) => {
  const timestamp = getTimestamp();
  const color = LogColors[level] || LogColors.INFO;
  const icon = LogIcons[level] || '';
  const reset = LogColors.RESET;

  let logMsg = `${color}${icon} [${timestamp}] [${operation.toUpperCase()}] ${message}${reset}`;

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    logMsg += `\n   ${color}Metadata: ${JSON.stringify(metadata, null, 2)}${reset}`;
  }

  return logMsg;
};

/**
 * Log operation start
 * 
 * @param {string} operation - Operation name
 * @param {Object} details - Operation details
 */
export const logOperationStart = (operation, details = {}) => {
  const message = formatLogMessage(
    LogLevel.INFO,
    operation,
    `Starting operation`,
    details
  );
  console.log(message);
};

/**
 * Log operation success
 * 
 * @param {string} operation - Operation name
 * @param {string} message - Success message
 * @param {Object} [stats={}] - Operation statistics
 */
export const logOperationSuccess = (operation, message, stats = {}) => {
  const logMsg = formatLogMessage(LogLevel.SUCCESS, operation, message, stats);
  console.log(logMsg);
};

/**
 * Log operation error
 * 
 * @param {string} operation - Operation name
 * @param {Error|string} error - Error object or message
 * @param {Object} [context={}] - Error context
 */
export const logOperationError = (operation, error, context = {}) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const metadata = {
    ...context,
    ...(error instanceof Error && { stack: error.stack }),
  };

  const logMsg = formatLogMessage(LogLevel.ERROR, operation, errorMessage, metadata);
  console.error(logMsg);
};

/**
 * Log operation warning
 * 
 * @param {string} operation - Operation name
 * @param {string} message - Warning message
 * @param {Object} [details={}] - Warning details
 */
export const logOperationWarning = (operation, message, details = {}) => {
  const logMsg = formatLogMessage(LogLevel.WARN, operation, message, details);
  console.warn(logMsg);
};

/**
 * Log operation debug info
 * 
 * @param {string} operation - Operation name
 * @param {string} message - Debug message
 * @param {Object} [data={}] - Debug data
 */
export const logOperationDebug = (operation, message, data = {}) => {
  if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
    const logMsg = formatLogMessage(LogLevel.DEBUG, operation, message, data);
    console.log(logMsg);
  }
};

/**
 * Log chunking operation
 */
export const logChunking = {
  start: (resumeId, fileName) =>
    logOperationStart('chunking', { resumeId, fileName }),

  success: (resumeId, chunkCount, duration) =>
    logOperationSuccess('chunking', `Created ${chunkCount} chunks`, {
      resumeId,
      chunkCount,
      duration: `${duration}ms`,
    }),

  error: (resumeId, error) =>
    logOperationError('chunking', error, { resumeId }),

  warning: (resumeId, message) =>
    logOperationWarning('chunking', message, { resumeId }),

  debug: (resumeId, message, data) =>
    logOperationDebug('chunking', message, { resumeId, ...data }),
};

/**
 * Log embedding operation
 */
export const logEmbedding = {
  start: (resumeId, chunkCount) =>
    logOperationStart('embedding', { resumeId, chunkCount }),

  chunkProcessing: (chunkId, index, total) =>
    logOperationDebug('embedding', `Processing chunk ${index + 1}/${total}`, {
      chunkId,
    }),

  success: (resumeId, successful, failed, duration) =>
    logOperationSuccess('embedding', `Completed embedding generation`, {
      resumeId,
      successful,
      failed,
      duration: `${duration}ms`,
    }),

  error: (resumeId, chunkId, error) =>
    logOperationError('embedding', error, { resumeId, chunkId }),

  warning: (resumeId, message) =>
    logOperationWarning('embedding', message, { resumeId }),

  retry: (chunkId, attempt, maxAttempts) =>
    logOperationWarning('embedding', `Retrying chunk embedding`, {
      chunkId,
      attempt,
      maxAttempts,
    }),

  skipped: (resumeId, reason) =>
    logOperationWarning('embedding', `Skipped: ${reason}`, { resumeId }),
};

/**
 * Log vector operation
 */
export const logVector = {
  start: (operation, count) =>
    logOperationStart('vector', { operation, count }),

  upload: (vectorId, namespace) =>
    logOperationDebug('vector', `Uploaded vector`, { vectorId, namespace }),

  batchUpload: (count, namespace, duration) =>
    logOperationSuccess('vector', `Batch uploaded ${count} vectors`, {
      count,
      namespace,
      duration: `${duration}ms`,
    }),

  delete: (vectorId) =>
    logOperationDebug('vector', `Deleted vector`, { vectorId }),

  error: (operation, error, context) =>
    logOperationError('vector', error, { operation, ...context }),

  query: (namespace, topK, resultsCount, duration) =>
    logOperationSuccess('vector', `Query completed`, {
      namespace,
      topK,
      resultsCount,
      duration: `${duration}ms`,
    }),
};

/**
 * Log search operation
 */
export const logSearch = {
  start: (resumeId, query) =>
    logOperationStart('search', { resumeId, query: query.substring(0, 50) }),

  success: (resumeId, resultCount, duration) =>
    logOperationSuccess('search', `Found ${resultCount} results`, {
      resumeId,
      resultCount,
      duration: `${duration}ms`,
    }),

  error: (resumeId, error) =>
    logOperationError('search', error, { resumeId }),

  noResults: (resumeId, query) =>
    logOperationWarning('search', 'No results found', {
      resumeId,
      query: query.substring(0, 50),
    }),
};

/**
 * Log pipeline operation
 */
export const logPipeline = {
  start: (pipeline, resumeId) =>
    logOperationStart('pipeline', { pipeline, resumeId }),

  stage: (pipeline, stage, resumeId) =>
    logOperationDebug('pipeline', `Stage: ${stage}`, { pipeline, resumeId }),

  success: (pipeline, resumeId, duration) =>
    logOperationSuccess('pipeline', `Pipeline completed`, {
      pipeline,
      resumeId,
      duration: `${duration}ms`,
    }),

  error: (pipeline, resumeId, error) =>
    logOperationError('pipeline', error, { pipeline, resumeId }),

  warning: (pipeline, message, details) =>
    logOperationWarning('pipeline', message, { pipeline, ...details }),
};

/**
 * Create a scoped logger for specific resume operations
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Object} Scoped logger
 */
export const createResumeLogger = (resumeId) => {
  return {
    chunking: {
      start: (fileName) => logChunking.start(resumeId, fileName),
      success: (chunkCount, duration) =>
        logChunking.success(resumeId, chunkCount, duration),
      error: (error) => logChunking.error(resumeId, error),
      warning: (message) => logChunking.warning(resumeId, message),
      debug: (message, data) => logChunking.debug(resumeId, message, data),
    },
    embedding: {
      start: (chunkCount) => logEmbedding.start(resumeId, chunkCount),
      success: (successful, failed, duration) =>
        logEmbedding.success(resumeId, successful, failed, duration),
      error: (chunkId, error) => logEmbedding.error(resumeId, chunkId, error),
      warning: (message) => logEmbedding.warning(resumeId, message),
      skipped: (reason) => logEmbedding.skipped(resumeId, reason),
    },
    search: {
      start: (query) => logSearch.start(resumeId, query),
      success: (resultCount, duration) =>
        logSearch.success(resumeId, resultCount, duration),
      error: (error) => logSearch.error(resumeId, error),
      noResults: (query) => logSearch.noResults(resumeId, query),
    },
  };
};

/**
 * Log structured error for debugging
 * 
 * @param {string} operation - Operation name
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 */
export const logStructuredError = (operation, error, context = {}) => {
  const errorLog = {
    timestamp: getTimestamp(),
    operation,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    context,
    environment: process.env.NODE_ENV,
  };

  console.error('\n=== STRUCTURED ERROR LOG ===');
  console.error(JSON.stringify(errorLog, null, 2));
  console.error('============================\n');
};

export default {
  logOperationStart,
  logOperationSuccess,
  logOperationError,
  logOperationWarning,
  logOperationDebug,
  logChunking,
  logEmbedding,
  logVector,
  logSearch,
  logPipeline,
  createResumeLogger,
  logStructuredError,
};
