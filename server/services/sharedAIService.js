/**
 * Shared AI Service
 * Reusable AI logic to reduce code duplication
 */

import { generateContent } from './geminiService.js';
import { sleep, calculateBackoff, estimateTokens } from '../utils/chatHelpers.js';
import { getCachedResponse, cacheResponse } from '../utils/aiCache.js';

/**
 * Call Gemini with retry mechanism and caching
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} AI response
 */
export const callGeminiWithRetryAndCache = async ({
  feature, // Feature name for caching (rewrite, star, interview, etc.)
  prompt, // Prompt to send
  cacheParams = null, // Parameters for cache key (null to disable caching)
  maxRetries = 3,
  retryDelay = 1000,
  temperature = 0.7,
  logPrefix = '[Shared AI]',
}) => {
  // Check cache if params provided
  if (cacheParams) {
    const cached = getCachedResponse(feature, cacheParams);
    if (cached) {
      console.log(`${logPrefix} 📦 Using cached response (age: ${Math.floor(cached.cacheAge / 1000)}s)`);
      return cached;
    }
  }

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateBackoff(attempt - 1, retryDelay);
        console.log(`${logPrefix} ⏳ Retry ${attempt}/${maxRetries} in ${delay}ms...`);
        await sleep(delay);
      }

      const response = await generateContent(prompt, true);

      // Cache successful response
      if (cacheParams) {
        cacheResponse(feature, cacheParams, response, {
          timestamp: Date.now(),
          temperature,
        });
      }

      return response;
    } catch (error) {
      lastError = error;

      const isRetryable =
        error.message.includes('timeout') ||
        error.message.includes('429') ||
        error.message.includes('503') ||
        error.message.includes('UNAVAILABLE') ||
        error.message.includes('JSON');

      if (!isRetryable || attempt >= maxRetries) {
        break;
      }

      console.log(`${logPrefix} ⚠️  Attempt ${attempt + 1} failed: ${error.message}`);
    }
  }

  throw lastError || new Error('AI request failed');
};

/**
 * Validate AI response structure
 * @param {Object} response - AI response
 * @param {Object} schema - Expected schema
 * @returns {Object} Validation result
 */
export const validateAIResponse = (response, schema) => {
  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in response)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check field types
  if (schema.types) {
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (field in response) {
        const actualType = Array.isArray(response[field]) ? 'array' : typeof response[field];
        if (actualType !== expectedType) {
          errors.push(`Invalid type for ${field}: expected ${expectedType}, got ${actualType}`);
        }
      }
    }
  }

  // Check array lengths
  if (schema.arrayLengths) {
    for (const [field, constraints] of Object.entries(schema.arrayLengths)) {
      if (field in response && Array.isArray(response[field])) {
        const length = response[field].length;
        if (constraints.min && length < constraints.min) {
          errors.push(`${field} array too short: expected min ${constraints.min}, got ${length}`);
        }
        if (constraints.max && length > constraints.max) {
          errors.push(`${field} array too long: expected max ${constraints.max}, got ${length}`);
        }
        if (constraints.exact && length !== constraints.exact) {
          errors.push(`${field} array wrong length: expected ${constraints.exact}, got ${length}`);
        }
      }
    }
  }

  // Check nested objects
  if (schema.nested) {
    for (const [field, nestedSchema] of Object.entries(schema.nested)) {
      if (field in response) {
        if (Array.isArray(response[field])) {
          // Validate each item in array
          response[field].forEach((item, index) => {
            const nestedResult = validateAIResponse(item, nestedSchema);
            if (!nestedResult.isValid) {
              errors.push(`${field}[${index}]: ${nestedResult.errors.join(', ')}`);
            }
          });
        } else {
          const nestedResult = validateAIResponse(response[field], nestedSchema);
          if (!nestedResult.isValid) {
            errors.push(`${field}: ${nestedResult.errors.join(', ')}`);
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Build common metadata object
 * @param {Object} options - Metadata options
 * @returns {Object} Metadata
 */
export const buildMetadata = ({
  model = 'gemini-1.5-flash',
  prompt,
  responseTime,
  fromCache = false,
}) => {
  return {
    model,
    tokensUsed: estimateTokens(prompt),
    responseTime,
    fromCache,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Format success response
 * @param {Object} data - Response data
 * @param {Object} metadata - Metadata
 * @returns {Object} Formatted response
 */
export const formatSuccessResponse = (data, metadata = {}) => {
  return {
    success: true,
    data,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Format error response
 * @param {Error} error - Error object
 * @param {Object} metadata - Metadata
 * @returns {Object} Formatted error
 */
export const formatErrorResponse = (error, metadata = {}) => {
  return {
    success: false,
    message: error.message || 'An error occurred',
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Log AI operation
 * @param {string} logPrefix - Log prefix
 * @param {string} operation - Operation name
 * @param {Object} details - Operation details
 */
export const logAIOperation = (logPrefix, operation, details = {}) => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${logPrefix} 🤖 ${operation}`);
  Object.entries(details).forEach(([key, value]) => {
    console.log(`${logPrefix} ${key}: ${value}`);
  });
  console.log(`${'='.repeat(70)}\n`);
};

/**
 * Common prompt builder utilities
 */
export const promptUtils = {
  /**
   * Build system instruction header
   */
  buildSystemHeader: (role, responsibilities) => {
    let header = `You are an expert ${role}. Your responsibilities:\n\n`;
    responsibilities.forEach((resp, idx) => {
      header += `${idx + 1}. ${resp}\n`;
    });
    return header + '\n';
  },

  /**
   * Build JSON format instruction
   */
  buildJSONInstruction: (structure, note = '') => {
    let instruction = `\nYour response MUST be in this EXACT JSON format (no markdown, no code blocks, pure JSON):\n\n`;
    instruction += JSON.stringify(structure, null, 2);
    if (note) {
      instruction += `\n\n${note}`;
    }
    return instruction;
  },

  /**
   * Build critical rules section
   */
  buildRulesSection: (rules) => {
    let section = `\nCRITICAL RULES:\n`;
    rules.forEach((rule, idx) => {
      section += `- ${rule}\n`;
    });
    return section;
  },

  /**
   * Build input data section
   */
  buildInputSection: (title, data) => {
    let section = `\n${title.toUpperCase()}:\n`;
    if (Array.isArray(data)) {
      data.forEach((item) => {
        section += `- ${item}\n`;
      });
    } else if (typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        section += `${key}: ${value}\n`;
      });
    } else {
      section += `${data}\n`;
    }
    return section;
  },
};

export default {
  callGeminiWithRetryAndCache,
  validateAIResponse,
  buildMetadata,
  formatSuccessResponse,
  formatErrorResponse,
  logAIOperation,
  promptUtils,
};
