/**
 * JWT Configuration
 * Configure JWT settings
 */

import dotenv from 'dotenv';

dotenv.config();

export const jwt = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

export default jwt;
