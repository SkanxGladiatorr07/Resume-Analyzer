/**
 * AI Rewrite Service
 * Handles AI-powered resume content rewriting
 * 
 * @module services/aiRewriteService
 */

import { generateContent } from './geminiService.js';
import { getContextForChat } from './retrievalService.js';
import Resume from '../models/Resume.js';
import RewriteHistory from '../models/RewriteHistory.js';
import rewriteConfig, {
  isValidSection,
  isValidTone,
  validateContentLength,
} from '../config/rewrite.js';
import { buildRewritePrompt, validateRewritePrompt } from './rewritePromptBuilder.js';
import { sleep, calculateBackoff } from '../utils/chatHelpers.js';

/**
 * Call Gemini with retry mechanism for rewriting
 * @param {string} prompt - Prompt to send
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} AI response
 */
const callGeminiWithRetry = async (prompt, attempt = 0) => {
  const maxRetries = rewriteConfig.gemini.maxRetries;
  const logPrefix = '[AI Rewrite]';

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
      const delay = calculateBackoff(attempt, rewriteConfig.gemini.retryDelay);
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
 * Validate rewrite request
 * @param {Object} params - Request parameters
 * @returns {Object} Validation result
 */
const validateRewriteRequest = ({ resumeId, section, content, tone }) => {
  const errors = [];

  // Validate required fields
  if (!resumeId) errors.push('Resume ID is required');
  if (!section) errors.push('Section is required');
  if (!content) errors.push('Content is required');
  if (!tone) errors.push('Tone is required');

  // Validate section
  if (section && !isValidSection(section)) {
    errors.push(
      `Invalid section. Supported: ${rewriteConfig.supportedSections.join(', ')}`
    );
  }

  // Validate tone
  if (tone && !isValidTone(tone)) {
    errors.push(`Invalid tone. Supported: ${rewriteConfig.supportedTones.join(', ')}`);
  }

  // Validate content length
  if (content) {
    const lengthValidation = validateContentLength(content);
    if (!lengthValidation.isValid) {
      errors.push(
        `Content length must be between ${lengthValidation.minLength} and ${lengthValidation.maxLength} characters. Current: ${lengthValidation.length}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get related context from resume
 * Retrieves related chunks to provide context for rewriting
 * 
 * @param {string} resumeId - Resume ID
 * @param {string} content - Content to rewrite
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Related chunks
 */
const getRelatedContext = async (resumeId, content, userId) => {
  if (!rewriteConfig.retrieval.enabled) {
    return [];
  }

  try {
    const retrievalResult = await getContextForChat({
      resumeId,
      query: content,
      userId,
      options: {
        topK: rewriteConfig.retrieval.topK,
        minSimilarityScore: rewriteConfig.retrieval.minSimilarityScore,
        maxContextLength: 2000,
        includeScores: false,
        includeSections: true,
      },
    });

    return retrievalResult.chunks || [];
  } catch (error) {
    console.warn('[AI Rewrite] Failed to get context, proceeding without it:', error.message);
    return [];
  }
};

/**
 * Rewrite resume content
 * Main service function for AI-powered rewriting
 * 
 * @param {Object} params - Rewrite parameters
 * @param {string} params.resumeId - Resume ID
 * @param {string} params.userId - User ID
 * @param {string} params.section - Section to rewrite
 * @param {string} params.content - Content to rewrite
 * @param {string} params.tone - Desired tone
 * @returns {Promise<Object>} Rewrite result
 */
export const rewriteContent = async ({ resumeId, userId, section, content, tone }) => {
  const startTime = Date.now();
  const logPrefix = '[AI Rewrite]';

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🔄 Starting Rewrite Pipeline`);
    console.log(`${logPrefix} Resume ID: ${resumeId}`);
    console.log(`${logPrefix} Section: ${section}`);
    console.log(`${logPrefix} Tone: ${tone}`);
    console.log(`${logPrefix} Content Length: ${content.length} characters`);
    console.log(`${'='.repeat(70)}\n`);

    // Step 1: Validate request
    console.log(`${logPrefix} ✅ Step 1/6: Validating request...`);
    const validation = validateRewriteRequest({ resumeId, section, content, tone });

    if (!validation.isValid) {
      throw new Error(`Invalid request: ${validation.errors.join(', ')}`);
    }

    // Step 2: Verify resume exists and belongs to user
    console.log(`${logPrefix} 📋 Step 2/6: Verifying resume...`);
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied. This resume does not belong to you.');
    }

    if (resume.embeddingStatus !== 'completed') {
      console.log(
        `${logPrefix} ⚠️  Resume embeddings not ready, proceeding without context`
      );
    }

    console.log(`${logPrefix} ✅ Resume verified: ${resume.fileName || resume.originalName}`);

    // Step 3: Get related context (optional)
    console.log(`${logPrefix} 🔍 Step 3/6: Retrieving related context...`);
    const relatedContext =
      resume.embeddingStatus === 'completed'
        ? await getRelatedContext(resumeId, content, userId)
        : [];

    console.log(`${logPrefix} ✅ Retrieved ${relatedContext.length} related chunks`);

    // Step 4: Build rewrite prompt
    console.log(`${logPrefix} 📝 Step 4/6: Building rewrite prompt...`);
    const promptObject = buildRewritePrompt({
      content,
      section,
      tone,
      relatedContext,
    });

    // Validate prompt
    const promptValidation = validateRewritePrompt(promptObject);
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
    console.log(`${logPrefix}    • Has Context: ${promptObject.metadata.hasContext ? 'Yes' : 'No'}`);

    // Step 5: Call Gemini AI
    console.log(`${logPrefix} 🤖 Step 5/6: Calling Gemini AI...`);
    const geminiStartTime = Date.now();
    const aiResponse = await callGeminiWithRetry(promptObject.text);
    const responseTime = Date.now() - geminiStartTime;

    console.log(`${logPrefix} ✅ Gemini responded successfully (${responseTime}ms)`);

    // Validate AI response
    if (!aiResponse.rewrittenContent || !Array.isArray(aiResponse.improvements)) {
      throw new Error(
        'Invalid AI response format. Expected rewrittenContent and improvements array.'
      );
    }

    console.log(`${logPrefix}    • Rewritten Length: ${aiResponse.rewrittenContent.length} characters`);
    console.log(`${logPrefix}    • Improvements: ${aiResponse.improvements.length}`);

    // Step 6: Save to history
    console.log(`${logPrefix} 💾 Step 6/6: Saving to history...`);
    const historyRecord = await RewriteHistory.createRewrite({
      userId,
      resumeId,
      section,
      tone,
      originalContent: content,
      rewrittenContent: aiResponse.rewrittenContent,
      improvements: aiResponse.improvements,
      metadata: {
        model: rewriteConfig.gemini.model,
        tokensUsed: promptObject.metadata.estimatedTokens,
        responseTime,
      },
    });

    console.log(`${logPrefix} ✅ Saved to history: ${historyRecord._id}`);

    const totalTime = Date.now() - startTime;
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🎉 Rewrite Pipeline Complete!`);
    console.log(`${logPrefix} Total Time: ${totalTime}ms`);
    console.log(`${'='.repeat(70)}\n`);

    return {
      success: true,
      data: {
        id: historyRecord._id,
        rewrittenContent: aiResponse.rewrittenContent,
        improvements: aiResponse.improvements,
        metadata: {
          originalLength: content.length,
          rewrittenLength: aiResponse.rewrittenContent.length,
          processingTime: totalTime,
          responseTime,
        },
      },
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`\n${'='.repeat(70)}`);
    console.error(`${logPrefix} ❌ REWRITE ERROR`);
    console.error(`${logPrefix} Error: ${error.message}`);
    console.error(`${logPrefix} Time: ${totalTime}ms`);
    console.error(`${'='.repeat(70)}\n`);

    // Save error to history
    try {
      await RewriteHistory.createErrorRewrite({
        userId,
        resumeId,
        section,
        tone,
        originalContent: content,
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
 * Get rewrite history for a resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} History result
 */
export const getRewriteHistory = async (resumeId, userId, options = {}) => {
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
    const history = await RewriteHistory.getResumeHistory(resumeId, options);

    return {
      success: true,
      data: {
        history,
        total: history.length,
        resumeId,
      },
    };
  } catch (error) {
    console.error('[AI Rewrite] Error getting history:', error.message);
    throw error;
  }
};

/**
 * Get user rewrite statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Statistics
 */
export const getUserRewriteStats = async (userId) => {
  try {
    const stats = await RewriteHistory.getUserStats(userId);

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('[AI Rewrite] Error getting stats:', error.message);
    throw error;
  }
};

export default {
  rewriteContent,
  getRewriteHistory,
  getUserRewriteStats,
};
