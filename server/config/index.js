/**
 * Configuration Index
 * Central export point for all configuration modules
 * 
 * @module config
 */

import { config as dotenvConfig } from 'dotenv';
import chatConfig from './chat.js';
import interviewConfig from './interview.js';
import projectsConfig from './projects.js';
import rewriteConfig from './rewrite.js';
import roadmapConfig from './roadmap.js';
import starConfig from './star.js';

// Load environment variables
dotenvConfig();

/**
 * Main application configuration
 */
const config = {
  // Server configuration
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/resumeai',
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
    credentials: true,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // AI configuration
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },

  // Pinecone configuration
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT || 'gcp-starter',
    indexName: process.env.PINECONE_INDEX_NAME || 'resumeai-index',
    namespace: process.env.PINECONE_NAMESPACE || 'resumes',
    dimension: parseInt(process.env.PINECONE_DIMENSION, 10) || 768,
    metric: process.env.PINECONE_METRIC || 'cosine',
  },

  // Embedding configuration
  embedding: {
    model: process.env.EMBEDDING_MODEL || 'text-embedding-004',
    dimension: parseInt(process.env.EMBEDDING_DIMENSION, 10) || 768,
    batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE, 10) || 100,
    maxRetries: parseInt(process.env.EMBEDDING_MAX_RETRIES, 10) || 3,
  },

  // Feature-specific configurations
  chat: chatConfig,
  interview: interviewConfig,
  projects: projectsConfig,
  rewrite: rewriteConfig,
  roadmap: roadmapConfig,
  star: starConfig,
};

// Export named exports for backward compatibility
export * from './pinecone.js';

// Export default configuration
export default config;
