/**
 * AI Roadmap Service
 * Handles AI-powered learning and career roadmap generation
 */

import { generateContent } from './geminiService.js';
import RoadmapHistory from '../models/RoadmapHistory.js';
import roadmapConfig from '../config/roadmap.js';
import { sleep, calculateBackoff, estimateTokens } from '../utils/chatHelpers.js';

/**
 * Call Gemini with retry mechanism
 */
const callGeminiWithRetry = async (prompt, attempt = 0) => {
  const maxRetries = roadmapConfig.gemini.maxRetries;
  const logPrefix = '[AI Roadmap]';

  try {
    const response = await generateContent(prompt, true);
    return response;
  } catch (error) {
    const isRetryable =
      error.message.includes('timeout') ||
      error.message.includes('429') ||
      error.message.includes('503') ||
      error.message.includes('UNAVAILABLE') ||
      error.message.includes('JSON');

    if (isRetryable && attempt < maxRetries) {
      const delay = calculateBackoff(attempt, roadmapConfig.gemini.retryDelay);
      console.log(
        `${logPrefix} Retry in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`
      );
      await sleep(delay);
      return callGeminiWithRetry(prompt, attempt + 1);
    }

    throw error;
  }
};

/**
 * Build learning roadmap prompt
 */
const buildLearningRoadmapPrompt = ({ currentSkills, targetRole, timeframe }) => {
  let prompt = roadmapConfig.prompts.learningSystemInstruction + '\n\n';

  // Add current skills
  prompt += `CURRENT SKILLS:\n`;
  prompt += currentSkills.length > 0
    ? currentSkills.map((skill) => `- ${skill}`).join('\n')
    : 'None specified (beginner level)\n';
  prompt += '\n\n';

  // Add target role
  prompt += `TARGET ROLE:\n${targetRole}\n\n`;

  // Add timeframe
  prompt += `TIMEFRAME:\n${timeframe}\n\n`;

  prompt += `TASK: Generate a structured learning roadmap that:\n`;
  prompt += `1. Builds on existing skills\n`;
  prompt += `2. Fills gaps needed for target role\n`;
  prompt += `3. Fits within the timeframe\n`;
  prompt += `4. Has clear phases and milestones\n`;
  prompt += `5. Includes actionable resources\n\n`;
  prompt += roadmapConfig.prompts.learningJsonFormat;

  return prompt;
};

/**
 * Build career roadmap prompt
 */
const buildCareerRoadmapPrompt = ({ currentRole, targetCareerRole, yearsOfExperience }) => {
  let prompt = roadmapConfig.prompts.careerSystemInstruction + '\n\n';

  // Add current role
  prompt += `CURRENT ROLE:\n${currentRole}\n\n`;

  // Add target role
  prompt += `TARGET ROLE:\n${targetCareerRole}\n\n`;

  // Add experience
  prompt += `YEARS OF EXPERIENCE:\n${yearsOfExperience} years\n\n`;

  prompt += `TASK: Generate a career progression roadmap that:\n`;
  prompt += `1. Maps realistic career progression\n`;
  prompt += `2. Identifies required skills and experiences\n`;
  prompt += `3. Suggests concrete actions and milestones\n`;
  prompt += `4. Accounts for current experience level\n`;
  prompt += `5. Includes both technical and leadership development\n\n`;
  prompt += roadmapConfig.prompts.careerJsonFormat;

  return prompt;
};

/**
 * Generate learning roadmap
 */
export const generateLearningRoadmap = async ({
  userId,
  currentSkills = [],
  targetRole,
  timeframe = '6 months',
}) => {
  const startTime = Date.now();
  const logPrefix = '[AI Roadmap - Learning]';

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🎯 Starting Learning Roadmap Generation`);
    console.log(`${logPrefix} User ID: ${userId}`);
    console.log(`${logPrefix} Target Role: ${targetRole}`);
    console.log(`${logPrefix} Timeframe: ${timeframe}`);
    console.log(`${'='.repeat(70)}\n`);

    // Step 1: Validate input
    console.log(`${logPrefix} Step 1/4: Validating input...`);
    if (!userId) throw new Error('User ID is required');
    if (!targetRole) throw new Error('Target role is required');

    console.log(`${logPrefix} ✅ Input validated`);

    // Step 2: Build prompt
    console.log(`${logPrefix} Step 2/4: Building prompt...`);
    const prompt = buildLearningRoadmapPrompt({
      currentSkills,
      targetRole,
      timeframe,
    });

    const estimatedTokensValue = estimateTokens(prompt);
    console.log(`${logPrefix} ✅ Prompt built (${estimatedTokensValue} estimated tokens)`);

    // Step 3: Call Gemini
    console.log(`${logPrefix} Step 3/4: Generating roadmap...`);
    const geminiStartTime = Date.now();
    const aiResponse = await callGeminiWithRetry(prompt);
    const responseTime = Date.now() - geminiStartTime;

    console.log(`${logPrefix} ✅ Roadmap generated (${responseTime}ms)`);

    // Validate response
    if (
      !aiResponse.overview ||
      !aiResponse.phases ||
      !Array.isArray(aiResponse.phases) ||
      !aiResponse.estimatedTimeline
    ) {
      throw new Error('Invalid AI response format');
    }

    console.log(`${logPrefix}    • Phases: ${aiResponse.phases.length}`);
    console.log(`${logPrefix}    • Timeline: ${aiResponse.estimatedTimeline}`);

    // Step 4: Save to history
    console.log(`${logPrefix} Step 4/4: Saving to history...`);
    const historyRecord = await RoadmapHistory.createRoadmap({
      userId,
      type: 'learning',
      currentSkills,
      targetRole,
      timeframe,
      roadmap: aiResponse,
      metadata: {
        model: roadmapConfig.gemini.model,
        tokensUsed: estimatedTokensValue,
        responseTime,
      },
    });

    const totalTime = Date.now() - startTime;
    console.log(`\n${logPrefix} 🎉 Complete! (${totalTime}ms)\n`);

    return {
      success: true,
      data: {
        id: historyRecord._id,
        roadmap: aiResponse,
        metadata: {
          processingTime: totalTime,
          responseTime,
        },
      },
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`\n${logPrefix} ❌ ERROR (${totalTime}ms)`);
    console.error(`${logPrefix} ${error.message}\n`);

    // Save error
    try {
      await RoadmapHistory.createErrorRoadmap({
        userId,
        type: 'learning',
        currentSkills,
        targetRole,
        timeframe,
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
 * Generate career roadmap
 */
export const generateCareerRoadmap = async ({
  userId,
  currentRole,
  targetCareerRole,
  yearsOfExperience = 0,
}) => {
  const startTime = Date.now();
  const logPrefix = '[AI Roadmap - Career]';

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🎯 Starting Career Roadmap Generation`);
    console.log(`${logPrefix} User ID: ${userId}`);
    console.log(`${logPrefix} Current Role: ${currentRole}`);
    console.log(`${logPrefix} Target Role: ${targetCareerRole}`);
    console.log(`${logPrefix} Experience: ${yearsOfExperience} years`);
    console.log(`${'='.repeat(70)}\n`);

    // Step 1: Validate input
    console.log(`${logPrefix} Step 1/4: Validating input...`);
    if (!userId) throw new Error('User ID is required');
    if (!currentRole) throw new Error('Current role is required');
    if (!targetCareerRole) throw new Error('Target career role is required');

    console.log(`${logPrefix} ✅ Input validated`);

    // Step 2: Build prompt
    console.log(`${logPrefix} Step 2/4: Building prompt...`);
    const prompt = buildCareerRoadmapPrompt({
      currentRole,
      targetCareerRole,
      yearsOfExperience,
    });

    const estimatedTokensValue = estimateTokens(prompt);
    console.log(`${logPrefix} ✅ Prompt built (${estimatedTokensValue} estimated tokens)`);

    // Step 3: Call Gemini
    console.log(`${logPrefix} Step 3/4: Generating roadmap...`);
    const geminiStartTime = Date.now();
    const aiResponse = await callGeminiWithRetry(prompt);
    const responseTime = Date.now() - geminiStartTime;

    console.log(`${logPrefix} ✅ Roadmap generated (${responseTime}ms)`);

    // Validate response
    if (
      !aiResponse.overview ||
      !aiResponse.phases ||
      !Array.isArray(aiResponse.phases) ||
      !aiResponse.estimatedTimeline
    ) {
      throw new Error('Invalid AI response format');
    }

    console.log(`${logPrefix}    • Phases: ${aiResponse.phases.length}`);
    console.log(`${logPrefix}    • Timeline: ${aiResponse.estimatedTimeline}`);

    // Step 4: Save to history
    console.log(`${logPrefix} Step 4/4: Saving to history...`);
    const historyRecord = await RoadmapHistory.createRoadmap({
      userId,
      type: 'career',
      currentRole,
      targetCareerRole,
      yearsOfExperience,
      roadmap: aiResponse,
      metadata: {
        model: roadmapConfig.gemini.model,
        tokensUsed: estimatedTokensValue,
        responseTime,
      },
    });

    const totalTime = Date.now() - startTime;
    console.log(`\n${logPrefix} 🎉 Complete! (${totalTime}ms)\n`);

    return {
      success: true,
      data: {
        id: historyRecord._id,
        roadmap: aiResponse,
        metadata: {
          processingTime: totalTime,
          responseTime,
        },
      },
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`\n${logPrefix} ❌ ERROR (${totalTime}ms)`);
    console.error(`${logPrefix} ${error.message}\n`);

    // Save error
    try {
      await RoadmapHistory.createErrorRoadmap({
        userId,
        type: 'career',
        currentRole,
        targetCareerRole,
        yearsOfExperience,
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
 * Get roadmap history
 */
export const getRoadmapHistory = async (userId, type = null, options = {}) => {
  try {
    const history = await RoadmapHistory.getUserHistory(userId, type, options);

    return {
      success: true,
      data: { history, total: history.length, userId, type },
    };
  } catch (error) {
    console.error('[AI Roadmap] Error getting history:', error.message);
    throw error;
  }
};

/**
 * Get user statistics
 */
export const getUserRoadmapStats = async (userId) => {
  try {
    const stats = await RoadmapHistory.getUserStats(userId);
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('[AI Roadmap] Error getting stats:', error.message);
    throw error;
  }
};

export default {
  generateLearningRoadmap,
  generateCareerRoadmap,
  getRoadmapHistory,
  getUserRoadmapStats,
};
