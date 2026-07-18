/**
 * AI Rewrite Service (Refactored)
 * Handles AI-powered resume content rewriting
 * Uses shared AI services and organized prompts
 */

import { getContextForChat } from './retrievalService.js';
import Resume from '../models/Resume.js';
import RewriteHistory from '../models/RewriteHistory.js';
import rewriteConfig, { isValidSection, isValidTone, validateContentLength } from '../config/rewrite.js';
import { buildRewritePrompt } from '../prompts/rewritePrompts.js';
import { callGeminiWithRetryAndCache, validateAIResponse, buildMetadata } from './sharedAIService.js';
import { REWRITE_SCHEMA } from '../utils/aiValidationSchemas.js';

/**
 * Validate rewrite request
 */
const validateRewriteRequest = ({ resumeId, section, content, tone }) => {
  const errors = [];

  if (!resumeId) errors.push('Resume ID is required');
  if (!section) errors.push('Section is required');
  if (!content) errors.push('Content is required');
  if (!tone) errors.push('Tone is required');

  if (section && !isValidSection(section)) {
    errors.push(`Invalid section. Supported: ${rewriteConfig.supportedSections.join(', ')}`);
  }

  if (tone && !isValidTone(tone)) {
    errors.push(`Invalid tone. Supported: ${rewriteConfig.supportedTones.join(', ')}`);
  }

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
    console.warn('[AI Rewrite] Failed to get context:', error.message);
    return [];
  }
};

/**
 * Rewrite resume content
 */
export const rewriteContent = async ({ resumeId, userId, section, content, tone }) => {
  const startTime = Date.now();
  const logPrefix = '[AI Rewrite]';

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🔄 Starting Rewrite`);
    console.log(`${logPrefix} Section: ${section} | Tone: ${tone}`);
    console.log(`${'='.repeat(70)}\n`);

    // Step 1: Validate
    console.log(`${logPrefix} Step 1/6: Validating...`);
    const validation = validateRewriteRequest({ resumeId, section, content, tone });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Step 2: Verify resume
    console.log(`${logPrefix} Step 2/6: Verifying resume...`);
    const resume = await Resume.findById(resumeId);
    if (!resume) throw new Error('Resume not found');
    if (resume.user.toString() !== userId.toString()) throw new Error('Access denied');
    console.log(`${logPrefix} ✅ Resume verified`);

    // Step 3: Get context
    console.log(`${logPrefix} Step 3/6: Retrieving context...`);
    const relatedContext =
      resume.embeddingStatus === 'completed'
        ? await getRelatedContext(resumeId, content, userId)
        : [];
    console.log(`${logPrefix} ✅ Context: ${relatedContext.length} chunks`);

    // Step 4: Build prompt using organized templates
    console.log(`${logPrefix} Step 4/6: Building prompt...`);
    const prompt = buildRewritePrompt({ section, tone, content, relatedContext });
    console.log(`${logPrefix} ✅ Prompt built`);

    // Step 5: Call AI with caching
    console.log(`${logPrefix} Step 5/6: Calling AI...`);
    const geminiStartTime = Date.now();
    
    const cacheParams = {
      resumeId: resumeId.toString(),
      section,
      tone,
      contentHash: require('crypto').createHash('md5').update(content).digest('hex'),
    };

    const aiResponse = await callGeminiWithRetryAndCache({
      feature: 'rewrite',
      prompt,
      cacheParams,
      maxRetries: rewriteConfig.gemini.maxRetries,
      retryDelay: rewriteConfig.gemini.retryDelay,
      temperature: rewriteConfig.gemini.temperature,
      logPrefix,
    });

    const responseTime = Date.now() - geminiStartTime;
    console.log(`${logPrefix} ✅ AI responded (${responseTime}ms)`);

    // Validate response
    const responseValidation = validateAIResponse(aiResponse, REWRITE_SCHEMA);
    if (!responseValidation.isValid) {
      throw new Error(`Invalid AI response: ${responseValidation.errors.join(', ')}`);
    }

    // Step 6: Save to history
    console.log(`${logPrefix} Step 6/6: Saving...`);
    const historyRecord = await RewriteHistory.createRewrite({
      userId,
      resumeId,
      section,
      tone,
      originalContent: content,
      rewrittenContent: aiResponse.rewrittenContent,
      improvements: aiResponse.improvements,
      metadata: buildMetadata({
        model: rewriteConfig.gemini.model,
        prompt,
        responseTime,
        fromCache: aiResponse.fromCache || false,
      }),
    });

    const totalTime = Date.now() - startTime;
    console.log(`\n${logPrefix} 🎉 Complete (${totalTime}ms)\n`);

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
          fromCache: aiResponse.fromCache || false,
        },
      },
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`\n${logPrefix} ❌ ERROR (${totalTime}ms): ${error.message}\n`);

    // Save error
    try {
      await RewriteHistory.createErrorRewrite({
        userId,
        resumeId,
        section,
        tone,
        originalContent: content,
        errorMessage: error.message,
        metadata: { processingTime: totalTime },
      });
    } catch (historyError) {
      console.error(`${logPrefix} Failed to save error:`, historyError.message);
    }

    throw error;
  }
};

/**
 * Get rewrite history
 */
export const getRewriteHistory = async (resumeId, userId, options = {}) => {
  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) throw new Error('Resume not found');
    if (resume.user.toString() !== userId.toString()) throw new Error('Access denied');

    const history = await RewriteHistory.getResumeHistory(resumeId, options);

    return {
      success: true,
      data: { history, total: history.length, resumeId },
    };
  } catch (error) {
    console.error('[AI Rewrite] Error getting history:', error.message);
    throw error;
  }
};

/**
 * Get user statistics
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
