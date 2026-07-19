/**
 * Environment Variable Validator
 * Validates required environment variables on application startup
 */

import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

/**
 * Required environment variables
 */
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'GEMINI_API_KEY',
];

/**
 * Optional environment variables with defaults
 */
const optionalEnvVars = {
  CORS_ORIGIN: 'http://localhost:5173',
  PINECONE_API_KEY: '',
  PINECONE_ENVIRONMENT: '',
  PINECONE_INDEX_NAME: '',
};

/**
 * Validation rules for environment variables
 */
const validationRules = {
  NODE_ENV: (value) => ['development', 'production', 'test'].includes(value),
  PORT: (value) => !isNaN(value) && parseInt(value) > 0 && parseInt(value) < 65536,
  MONGODB_URI: (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
  JWT_SECRET: (value) => value.length >= 32,
  JWT_EXPIRES_IN: (value) => /^\d+[dhms]$/.test(value),
  GEMINI_API_KEY: (value) => value.length > 0,
};

/**
 * Error messages for validation failures
 */
const errorMessages = {
  NODE_ENV: 'Must be one of: development, production, test',
  PORT: 'Must be a valid port number (1-65535)',
  MONGODB_URI: 'Must be a valid MongoDB connection string',
  JWT_SECRET: 'Must be at least 32 characters long for security',
  JWT_EXPIRES_IN: 'Must be in format: 1d, 7d, 30d, etc.',
  GEMINI_API_KEY: 'Must not be empty',
};

/**
 * Validate a single environment variable
 */
const validateEnvVar = (key, value) => {
  if (!value) {
    return { valid: false, message: `${key} is required but not defined` };
  }

  if (validationRules[key] && !validationRules[key](value)) {
    return { 
      valid: false, 
      message: `${key} validation failed: ${errorMessages[key] || 'Invalid value'}` 
    };
  }

  return { valid: true };
};

/**
 * Validate all environment variables
 */
export const validateEnvironment = () => {
  console.log('🔍 Validating environment variables...');
  
  const errors = [];
  const warnings = [];

  // Check required variables
  for (const key of requiredEnvVars) {
    const value = process.env[key];
    const result = validateEnvVar(key, value);
    
    if (!result.valid) {
      errors.push(result.message);
    }
  }

  // Check optional variables and apply defaults
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      if (defaultValue) {
        warnings.push(`${key} not set, using default: ${defaultValue}`);
      } else {
        warnings.push(`${key} not set (optional)`);
      }
    }
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Environment Warnings:');
    warnings.forEach((warning) => console.log(`   - ${warning}`));
  }

  // Handle errors
  if (errors.length > 0) {
    console.error('\n❌ Environment Validation Failed:');
    console.error('='.repeat(60));
    errors.forEach((error) => console.error(`   - ${error}`));
    console.error('='.repeat(60));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    console.error('   Copy .env.example to .env and fill in the values.\n');
    return false;
  }

  console.log('✅ Environment validation passed\n');
  return true;
};

/**
 * Get environment variable with validation
 */
export const getEnv = (key, defaultValue = null) => {
  const value = process.env[key];
  
  if (!value && defaultValue === null) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  
  return value || defaultValue;
};

/**
 * Check if running in production
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if running in test mode
 */
export const isTest = () => {
  return process.env.NODE_ENV === 'test';
};

/**
 * Print environment summary
 */
export const printEnvironmentSummary = () => {
  console.log('\n📋 Environment Configuration:');
  console.log('='.repeat(60));
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✓ Set' : '✗ Not set'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Not set'}`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Not set'}`);
  console.log(`   CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);
  console.log('='.repeat(60));
};

export default validateEnvironment;
