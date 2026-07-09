import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * JWT Utility Module
 * Handles JWT token generation and verification
 */

/**
 * Generate JWT token
 * @param {String} userId - User ID to encode in token
 * @returns {String} JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {String} token - JWT token to decode
 * @returns {Object|null} Decoded token or null
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
