/**
 * AI STAR Service
 * Handles AI-powered STAR bullet point generation
 * 
 * @module services/aiStarService
 */

import { generateContent } from './geminiService.js';
import Resume from '../models/Resume.js';
import StarHistory from '../models/StarHistory.js';
import starConfig, { validateContentLength } from '../config/star.js';
import { buildStarPrompt, validateStarPrompt } from './starPromptBuilder.js';
import { sleep, calculateBackoff } from '../utils/chatHelpers.js';

/**
 * Call Gemini with retry mechanism for STAR generation
 * @param {string} prompt - Prompt to send
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} AI response
 */
const callGeminiWithRetry = async (prompt, attempt = 0) => {
  const maxRetries = starConfig.gemini.maxRetries;
  const logPrefix = '[AI STAR]';

  try {
    const response = await generateContent(prompt, true);
    return response;
  } catch (error) {
    // Check if we should retry
    const isRetryable =
      error.message.includes('timeout') ||
      error.message.includes('429') ||
      error.message.includes('503') ||
      error.message.includes('UNAVAILABLE') ||
      error.message.includes('JSON');

    if (isRetryable && attempt < maxRetries) {
      const delay = calculateBackoff(attempt, starConfig.gemini.retryDelay);
      console.log(
        `${logPrefix} Gemini call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`
      );
      console.log(`${logPrefix} Error: ${error.message}`);

      await sleep(delay);
      return callGeminiWithRetry(prompt, attempt + 1);
    }

    // Max retries reached or non-retryable error
    console.error(`${logPrefix} Gemini call failed after ${attempt + 1} attempts`);
    throw error;
  }
};

/**
 * Validate STAR request
 * @param {Object} params - Request parameters
 * @returns {Object} Validation result
 */
const validateStarRequest = ({ resumeId, experience }) => {
  const errors = [];

  // Validate required fields
  if (!resumeId) errors.push('Resume ID is required');
  if (!experience) errors.push('Experience is required');

  // Validate experience type
  if (experience && typeof experience !== 'string') {
    errors.push('Experience must be a string');
  }

  // Validate content length
  if (experience) {
    const lengthValidation = validateContentLength(experience);
    if (!lengthValidation.isValid) {
      errors.push(
        `Experience length must be between ${lengthValidation.minLength} and ${lengthValidation.maxLength} characters. Current: ${lengthValidation.length}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate STAR response structure
 * @param {Object} response - AI response
 * @returns {Object} Validation result
 */
const validateStarResponse = (response) => {
  const errors = [];

  // Check required fields
  if (!response.original || typeof response.original !== 'string') {
    errors.push('Response must include "original" field as string');
  }

  if (!response.starVersion || typeof response.starVersion !== 'string') {
    errors.push('Response must include "starVersion" field as string');
  }

  if (!response.breakdown || typeof response.breakdown !== 'object') {
    errors.push('Response must include "breakdown" field as object');
  }

  // Validate breakdown structure
  if (response.breakdown) {
    const required = ['situation', 'task', 'action', 'result'];
    required.forEach((field) => {
      if (!response.breakdown[field] || typeof response.breakdown[field] !== 'string') {
        errors.push(`Breakdown must include "${field}" field as string`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate STAR bullet point
 * Main service function for STAR generation
 * 
 * @param {Object} params - Generation parameters
 * @param {string} params.resumeId - Resume ID
 * @param {string} params.userId - User ID
 * @param {string} params.experience - Experience text to convert
 * @returns {Promise<Object>} STAR generation result
 */
export const generateStarBullet = async ({ resumeId, userId, experience }) => {
  const startTime = Date.now();
  const logPrefix = '[AI STAR]';

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🌟 Starting STAR Generation Pipeline`);
    console.log(`${logPrefix} Resume ID: ${resumeId}`);
    console.log(`${logPrefix} Experience Length: ${experience.length} characters`);
    console.log(`${'='.repeat(70)}\n`);

    // Step 1: Validate request
    console.log(`${logPrefix} ✅ Step 1/5: Validating request...`);
    const validation = validateStarRequest({ resumeId, experience });

    if (!validation.isValid) {
      throw new Error(`Invalid request: ${validation.errors.join(', ')}`);
    }

    // Step 2: Verify resume exists and belongs to user
    console.log(`${logPrefix} 📋 Step 2/5: Verifying resume...`);
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied. This resume does not belong to you.');
    }

    console.log(`${logPrefix} ✅ Resume verified: ${resume.fileName || resume.originalName}`);

    // Step 3: Build STAR prompt
    console.log(`${logPrefix} 📝 Step 3/5: Building STAR prompt...`);
    const promptObject = buildStarPrompt(experience);

    // Validate prompt
    const promptValidation = validateStarPrompt(promptObject);
    if (!promptValidation.isValid) {
      throw new Error(`Invalid prompt: ${promptValidation.errors.join(', ')}`);
    }

    if (promptValidation.warnings.length > 0) {
      promptValidation.warnings.forEach((warning) => {
        console.log(`${logPrefix} ⚠️  ${warning}`);
      });
    }

    console.log(`${logPrefix} ✅ Prompt built successfully`);
    console.log(`${logPrefix}    • Estimated Tokens: ${promptObject.metadata.estimatedTokens}`);

    // Step 4: Call Gemini AI
    console.log(`${logPrefix} 🤖 Step 4/5: Calling Gemini AI...`);
    const geminiStartTime = Date.now();
    const aiResponse = await callGeminiWithRetry(promptObject.text);
    const responseTime = Date.now() - geminiStartTime;

    console.log(`${logPrefix} ✅ Gemini responded successfully (${responseTime}ms)`);

    // Validate AI response structure
    const responseValidation = validateStarResponse(aiResponse);
    if (!responseValidation.isValid) {
      throw new Error(
        `Invalid AI response format: ${responseValidation.errors.join(', ')}`
      );
    }

    console.log(`${logPrefix}    • STAR Version Length: ${aiResponse.starVersion.length} characters`);
    console.log(`${logPrefix}    • Breakdown Complete: ✅`);

    // Step 5: Save to history
    console.log(`${logPrefix} 💾 Step 5/5: Saving to history...`);
    const historyRecord = await StarHistory.createStar({
      userId,
      resumeId,
      original: aiResponse.original,
      starVersion: aiResponse.starVersion,
      breakdown: aiResponse.breakdown,
      metadata: {
        model: starConfig.gemini.model,
        tokensUsed: promptObject.metadata.estimatedTokens,
        responseTime,
      },
    });

    console.log(`${logPrefix} ✅ Saved to history: ${historyRecord._id}`);

    const totalTime = Date.now() - startTime;
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🎉 STAR Generation Complete!`);
    console.log(`${logPrefix} Total Time: ${totalTime}ms`);
    console.log(`${'='.repeat(70)}\n`);

    return {
      success: true,
      data: {
        id: historyRecord._id,
        original: aiResponse.original,
        starVersion: aiResponse.starVersion,
        breakdown: aiResponse.breakdown,
        metadata: {
          originalLength: experience.length,
          starLength: aiResponse.starVersion.length,
          processingTime: totalTime,
          responseTime,
        },
      },
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`\n${'='.repeat(70)}`);
    console.error(`${logPrefix} ❌ STAR GENERATION ERROR`);
    console.error(`${logPrefix} Error: ${error.message}`);
    console.error(`${logPrefix} Time: ${totalTime}ms`);
    console.error(`${'='.repeat(70)}\n`);

    // Save error to history
    try {
      await StarHistory.createErrorStar({
        userId,
        resumeId,
        original: experience,
        errorMessage: error.message,
        metadata: {
          processingTime: totalTime,
        },
      });
    } catch (historyError) {
      console.error(`${logPrefix} Failed to save error to history:`, historyError.message);
    }

    throw error;
  }
};

/**
 * Get STAR history for a resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} History result
 */
export const getStarHistory = async (resumeId, userId, options = {}) => {
  try {
    // Verify resume belongs to user
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied');
    }

    // Get history
    const history = await StarHistory.getResumeHistory(resumeId, options);

    return {
      success: true,
      data: {
        history,
        total: history.length,
        resumeId,
      },
    };
  } catch (error) {
    console.error('[AI STAR] Error getting history:', error.message);
    throw error;
  }
};

/**
 * Get user STAR statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Statistics
 */
export const getUserStarStats = async (userId) => {
  try {
    const stats = await StarHistory.getUserStats(userId);

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('[AI STAR] Error getting stats:', error.message);
    throw error;
  }
};

export default {
  generateStarBullet,
  getStarHistory,
  getUserStarStats,
};
