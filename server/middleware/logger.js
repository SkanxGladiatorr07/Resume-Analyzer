/**
 * Request Logging Middleware
 * Logs HTTP requests with detailed information
 */

import morgan from 'morgan';
import config from '../config/index.js';

/**
 * Custom token for response time in milliseconds
 */
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '0ms';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 + 
              (res._startAt[1] - req._startAt[1]) / 1000000;
  return `${ms.toFixed(2)}ms`;
});

/**
 * Custom token for request body size
 */
morgan.token('body-size', (req) => {
  if (!req.body) return '0';
  return JSON.stringify(req.body).length;
});

/**
 * Custom token for user ID
 */
morgan.token('user-id', (req) => {
  return req.user?._id?.toString() || 'anonymous';
});

/**
 * Custom format for detailed logging
 */
const detailedFormat = ':method :url :status :response-time-ms - :user-id - :remote-addr';

/**
 * Custom format for compact logging
 */
const compactFormat = ':method :url :status :response-time-ms';

/**
 * Logger middleware for development environment
 */
export const devLogger = morgan(detailedFormat, {
  skip: (req) => {
    // Skip health check and static file requests
    return req.url === '/api/health' || req.url.startsWith('/static');
  },
});

/**
 * Logger middleware for production environment
 * Logs to console with JSON format for log aggregation
 */
export const prodLogger = morgan((tokens, req, res) => {
  const log = {
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens['response-time'](req, res),
    userAgent: tokens['user-agent'](req, res),
    ip: tokens['remote-addr'](req, res),
    userId: req.user?._id?.toString() || null,
  };

  // Only log errors in production
  if (res.statusCode >= 400) {
    console.error(JSON.stringify(log));
  }

  return null;
}, {
  skip: (req) => {
    return req.url === '/api/health';
  },
});

/**
 * Get appropriate logger based on environment
 */
export const getLogger = () => {
  const env = config.server?.env || process.env.NODE_ENV || 'development';
  return env === 'production' ? prodLogger : devLogger;
};

/**
 * Simple request logger for debugging
 */
export const simpleLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const emoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
    
    console.log(
      `${emoji} ${req.method} ${req.path} - ${status} - ${duration}ms`
    );
  });
  
  next();
};

export default getLogger;
