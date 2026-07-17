/**
 * Chat Helper Utilities
 * Common utilities for chat functionality
 * 
 * @module utils/chatHelpers
 */

import crypto from 'crypto';
import chatConfig from '../config/chat.js';

/**
 * In-memory store for duplicate request detection
 * In production, use Redis or similar
 */
const requestCache = new Map();

/**
 * Generate request hash for duplicate detection
 * @param {string} sessionId - Session ID
 * @param {string} message - User message
 * @returns {string} Hash
 */
export const generateRequestHash = (sessionId, message) => {
  return crypto
    .createHash('sha256')
    .update(`${sessionId}:${message.trim().toLowerCase()}`)
    .digest('hex');
};

/**
 * Check if request is duplicate
 * @param {string} sessionId - Session ID
 * @param {string} message - User message
 * @returns {boolean} True if duplicate
 */
export const isDuplicateRequest = (sessionId, message) => {
  const hash = generateRequestHash(sessionId, message);
  const cached = requestCache.get(hash);

  if (cached) {
    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if within duplicate window
    if (age < chatConfig.requestHandling.duplicateWindow) {
      return true;
    }

    // Expired, remove from cache
    requestCache.delete(hash);
  }

  return false;
};

/**
 * Mark request as in-progress
 * @param {string} sessionId - Session ID
 * @param {string} message - User message
 */
export const markRequestInProgress = (sessionId, message) => {
  const hash = generateRequestHash(sessionId, message);
  requestCache.set(hash, {
    timestamp: Date.now(),
    sessionId,
    message,
  });
};

/**
 * Clear request from cache
 * @param {string} sessionId - Session ID
 * @param {string} message - User message
 */
export const clearRequest = (sessionId, message) => {
  const hash = generateRequestHash(sessionId, message);
  requestCache.delete(hash);
};

/**
 * Clear old requests from cache (cleanup)
 * Should be called periodically
 */
export const cleanupRequestCache = () => {
  const now = Date.now();
  const maxAge = chatConfig.requestHandling.duplicateWindow * 2;

  for (const [hash, data] of requestCache.entries()) {
    if (now - data.timestamp > maxAge) {
      requestCache.delete(hash);
    }
  }
};

/**
 * Estimate token count for text
 * Rough estimation: ~4 characters per token
 * @param {string} text - Text to estimate
 * @returns {number} Estimated tokens
 */
export const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

/**
 * Truncate context to fit token limit
 * @param {string} context - Context text
 * @param {number} maxTokens - Maximum tokens
 * @returns {string} Truncated context
 */
export const truncateContext = (context, maxTokens) => {
  const estimatedTokens = estimateTokens(context);

  if (estimatedTokens <= maxTokens) {
    return context;
  }

  // Calculate approximate character limit
  const maxChars = Math.floor(maxTokens * 4 * 0.95); // 95% to be safe
  return context.substring(0, maxChars) + '\n\n[Context truncated to fit token limit]';
};

/**
 * Filter chunks by minimum similarity score
 * @param {Array} chunks - Retrieved chunks
 * @param {number} minScore - Minimum similarity score
 * @returns {Array} Filtered chunks
 */
export const filterChunksByScore = (chunks, minScore) => {
  return chunks.filter((chunk) => chunk.score >= minScore);
};

/**
 * Optimize chunks for context
 * Remove duplicates, sort by score, limit size
 * @param {Array} chunks - Retrieved chunks
 * @param {Object} options - Options
 * @returns {Array} Optimized chunks
 */
export const optimizeChunks = (chunks, options = {}) => {
  const {
    minScore = chatConfig.retrieval.minSimilarityScore,
    maxChunks = chatConfig.retrieval.topK,
    maxLength = chatConfig.retrieval.maxContextLength,
  } = options;

  // Filter by score
  let filtered = filterChunksByScore(chunks, minScore);

  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score);

  // Limit number of chunks
  filtered = filtered.slice(0, maxChunks);

  // Limit total length
  let totalLength = 0;
  const result = [];

  for (const chunk of filtered) {
    const chunkLength = chunk.text?.length || 0;

    if (totalLength + chunkLength > maxLength) {
      // Try to include partial chunk if there's room
      const remaining = maxLength - totalLength;
      if (remaining > 200) {
        // At least 200 chars
        result.push({
          ...chunk,
          text: chunk.text.substring(0, remaining) + '...',
        });
      }
      break;
    }

    result.push(chunk);
    totalLength += chunkLength;
  }

  return result;
};

/**
 * Validate message content
 * @param {string} message - User message
 * @returns {Object} Validation result
 */
export const validateMessage = (message) => {
  const errors = [];

  if (!message || typeof message !== 'string') {
    errors.push('Message must be a string');
  }

  if (message && message.trim().length === 0) {
    errors.push('Message cannot be empty');
  }

  if (message && message.length < chatConfig.messageLimits.minMessageLength) {
    errors.push(`Message must be at least ${chatConfig.messageLimits.minMessageLength} character`);
  }

  if (message && message.length > chatConfig.messageLimits.maxMessageLength) {
    errors.push(`Message cannot exceed ${chatConfig.messageLimits.maxMessageLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format session title from first message
 * @param {string} message - User message
 * @returns {string} Formatted title
 */
export const generateSessionTitle = (message) => {
  const maxLength = chatConfig.session.maxTitleLength;

  // Remove extra whitespace
  let title = message.trim().replace(/\s+/g, ' ');

  // Truncate if too long
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + '...';
  }

  return title;
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Attempt number (0-indexed)
 * @param {number} baseDelay - Base delay in ms
 * @returns {number} Delay in ms
 */
export const calculateBackoff = (attempt, baseDelay = chatConfig.gemini.retryDelay) => {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000); // Max 10 seconds
};

/**
 * Sanitize text for logging
 * Truncate long messages for cleaner logs
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized text
 */
export const sanitizeForLog = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get session short ID for logging
 * @param {string} sessionId - Full session ID
 * @returns {string} Short ID (last 6 characters)
 */
export const getShortId = (sessionId) => {
  if (!sessionId) return 'unknown';
  return sessionId.toString().slice(-6);
};

/**
 * Cleanup utility - should be called periodically
 * Cleans up request cache and other temporary data
 */
export const performCleanup = () => {
  cleanupRequestCache();
  // Add other cleanup tasks here
};

// Schedule cleanup every 5 minutes
if (chatConfig.logging.enabled) {
  setInterval(performCleanup, 5 * 60 * 1000);
}

export default {
  generateRequestHash,
  isDuplicateRequest,
  markRequestInProgress,
  clearRequest,
  cleanupRequestCache,
  estimateTokens,
  truncateContext,
  filterChunksByScore,
  optimizeChunks,
  validateMessage,
  generateSessionTitle,
  sleep,
  calculateBackoff,
  sanitizeForLog,
  getShortId,
  performCleanup,
};
