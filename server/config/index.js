/**
 * Configuration Index
 * Central export point for all configuration modules
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// JWT Configuration
const jwt = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// Server Configuration
const server = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
};

// CORS Configuration
const cors = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
  credentials: true,
};

// Database Configuration
const database = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/resumeai',
};

// Export named configs
export { jwt, server, cors, database };

// Export default config object
const config = {
  jwt,
  server,
  cors,
  database,
};

export default config;
