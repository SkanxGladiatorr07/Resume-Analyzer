/**
 * AI Projects Service
 * Handles AI-powered project suggestions generation
 */

import { generateContent } from './geminiService.js';
import ProjectHistory from '../models/ProjectHistory.js';
import projectsConfig from '../config/projects.js';
import { sleep, calculateBackoff, estimateTokens } from '../utils/chatHelpers.js';

/**
 * Call Gemini with retry mechanism
 */
const callGeminiWithRetry = async (prompt, attempt = 0) => {
  const maxRetries = projectsConfig.gemini.maxRetries;
  const logPrefix = '[AI Projects]';

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
      const delay = calculateBackoff(attempt, projectsConfig.gemini.retryDelay);
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
 * Build projects prompt
 */
const buildProjectsPrompt = ({ existingSkills, missingSkills, careerGoal }) => {
  let prompt = projectsConfig.prompts.systemInstruction + '\n\n';

  // Add existing skills
  prompt += `EXISTING SKILLS:\n`;
  prompt += existingSkills.length > 0 
    ? existingSkills.map((skill) => `- ${skill}`).join('\n')
    : 'None specified\n';
  prompt += '\n\n';

  // Add missing skills (skills to develop)
  prompt += `SKILLS TO DEVELOP:\n`;
  prompt += missingSkills.length > 0
    ? missingSkills.map((skill) => `- ${skill}`).join('\n')
    : 'None specified\n';
  prompt += '\n\n';

  // Add career goal
  if (careerGoal) {
    prompt += `CAREER GOAL:\n${careerGoal}\n\n`;
  }

  prompt += `TASK: Generate 5 portfolio-worthy projects that:\n`;
  prompt += `1. Build on existing skills\n`;
  prompt += `2. Teach missing skills\n`;
  prompt += `3. Align with career goals\n`;
  prompt += `4. Are achievable and practical\n`;
  prompt += `5. Can be showcased in a portfolio\n\n`;
  prompt += `Mix difficulties (2 beginner, 2 intermediate, 1 advanced) to show progression.\n\n`;
  prompt += projectsConfig.prompts.jsonFormatInstruction;

  return prompt;
};

/**
 * Generate project suggestions
 */
export const generateProjectSuggestions = async ({
  userId,
  existingSkills = [],
  missingSkills = [],
  careerGoal = '',
}) => {
  const startTime = Date.now();
  const logPrefix = '[AI Projects]';

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🎯 Starting Project Suggestions Generation`);
    console.log(`${logPrefix} User ID: ${userId}`);
    console.log(`${logPrefix} Existing Skills: ${existingSkills.length}`);
    console.log(`${logPrefix} Missing Skills: ${missingSkills.length}`);
    console.log(`${'='.repeat(70)}\n`);

    // Step 1: Validate input
    console.log(`${logPrefix} Step 1/4: Validating input...`);
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (existingSkills.length === 0 && missingSkills.length === 0) {
      throw new Error('At least one skill (existing or missing) is required');
    }

    console.log(`${logPrefix} ✅ Input validated`);

    // Step 2: Build prompt
    console.log(`${logPrefix} Step 2/4: Building prompt...`);
    const prompt = buildProjectsPrompt({
      existingSkills,
      missingSkills,
      careerGoal,
    });

    const estimatedTokensValue = estimateTokens(prompt);
    console.log(`${logPrefix} ✅ Prompt built (${estimatedTokensValue} estimated tokens)`);

    // Step 3: Call Gemini
    console.log(`${logPrefix} Step 3/4: Generating projects...`);
    const geminiStartTime = Date.now();
    const aiResponse = await callGeminiWithRetry(prompt);
    const responseTime = Date.now() - geminiStartTime;

    console.log(`${logPrefix} ✅ Projects generated (${responseTime}ms)`);

    // Validate response
    if (!aiResponse.projects || !Array.isArray(aiResponse.projects)) {
      throw new Error('Invalid AI response format');
    }

    if (aiResponse.projects.length !== projectsConfig.projectCount) {
      console.log(
        `${logPrefix} ⚠️  Expected ${projectsConfig.projectCount} projects, got ${aiResponse.projects.length}`
      );
    }

    // Validate each project
    aiResponse.projects.forEach((project, index) => {
      if (!project.name || !project.description || !project.difficulty) {
        throw new Error(`Project ${index + 1} is missing required fields`);
      }
    });

    console.log(`${logPrefix}    • Generated ${aiResponse.projects.length} projects`);

    // Step 4: Save to history
    console.log(`${logPrefix} Step 4/4: Saving to history...`);
    const historyRecord = await ProjectHistory.createProject({
      userId,
      existingSkills,
      missingSkills,
      careerGoal,
      projects: aiResponse.projects,
      metadata: {
        model: projectsConfig.gemini.model,
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
        projects: aiResponse.projects,
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
      await ProjectHistory.createErrorProject({
        userId,
        existingSkills,
        missingSkills,
        careerGoal,
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
 * Get project history
 */
export const getProjectHistory = async (userId, options = {}) => {
  try {
    const history = await ProjectHistory.getUserHistory(userId, options);

    return {
      success: true,
      data: { history, total: history.length, userId },
    };
  } catch (error) {
    console.error('[AI Projects] Error getting history:', error.message);
    throw error;
  }
};

/**
 * Get user statistics
 */
export const getUserProjectStats = async (userId) => {
  try {
    const stats = await ProjectHistory.getUserStats(userId);
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('[AI Projects] Error getting stats:', error.message);
    throw error;
  }
};

export default {
  generateProjectSuggestions,
  getProjectHistory,
  getUserProjectStats,
};
