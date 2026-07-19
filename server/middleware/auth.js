import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';
import { sendUnauthorized, sendServerError } from '../utils/responseFormatter.js';

/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens with comprehensive error handling
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return sendUnauthorized(res, 'Access denied. No authorization header provided.');
    }

    if (!authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Invalid authorization format. Use: Bearer <token>');
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
      return sendUnauthorized(res, 'Access denied. No token provided.');
    }

    // Verify token with enhanced error handling
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      // Specific JWT error handling
      if (error.message === 'Token has expired') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
          timestamp: new Date().toISOString(),
        });
      }
      
      if (error.message === 'Invalid token') {
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token. Please log in again.',
          code: 'TOKEN_INVALID',
          timestamp: new Date().toISOString(),
        });
      }

      // Generic token error
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please log in again.',
        code: 'TOKEN_ERROR',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate decoded token structure
    if (!decoded || !decoded.id) {
      return sendUnauthorized(res, 'Invalid token payload. Please log in again.');
    }

    // Find user by ID from token with optimized query
    const user = await User.findById(decoded.id)
      .select('-password')
      .lean(); // Use lean for better performance

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found. Token is no longer valid.',
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user account is active (if you have this field)
    // if (user.status === 'inactive' || user.status === 'suspended') {
    //   return sendUnauthorized(res, 'Account is inactive. Please contact support.');
    // }

    // Attach user to request object
    req.user = user;
    
    // Attach user ID separately for convenience
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
    });
    
    return sendServerError(res, 'Server error during authentication. Please try again.');
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't reject if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  } catch (error) {
    next();
  }
};
