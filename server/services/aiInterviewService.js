/**
 * AI Interview Service
 * Handles AI-powered interview question generation
 */

import { generateContent } from './geminiService.js';
import { getContextForChat } from './retrievalService.js';
import Resume from '../models/Resume.js';
import InterviewHistory from '../models/InterviewHistory.js';
import interviewConfig from '../config/interview.js';
import { sleep, calculateBackoff, estimateTokens } from '../utils/chatHelpers.js';

/**
 * Call Gemini with retry mechanism
 */
const callGeminiWithRetry = async (prompt, attempt = 0) => {
  const maxRetries = interviewConfig.gemini.maxRetries;
  const logPrefix = '[AI Interview]';

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
      const delay = calculateBackoff(attempt, interviewConfig.gemini.retryDelay);
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
 * Build interview prompt
 */
const buildInterviewPrompt = ({ resumeContext, aiAnalysis, jobDescription }) => {
  let prompt = interviewConfig.prompts.systemInstruction + '\n\n';

  // Add resume context
  prompt += `CANDIDATE RESUME SUMMARY:\n${resumeContext}\n\n`;

  // Add AI analysis if available
  if (aiAnalysis) {
    prompt += `RESUME ANALYSIS:\n`;
    prompt += `- ATS Score: ${aiAnalysis.score}/100\n`;
    prompt += `- Key Skills: ${aiAnalysis.skills?.join(', ') || 'N/A'}\n`;
    prompt += `- Experience Level: ${aiAnalysis.experienceLevel || 'N/A'}\n\n`;
  }

  // Add job description if provided
  if (jobDescription) {
    prompt += `TARGET JOB DESCRIPTION:\n${jobDescription}\n\n`;
  }

  prompt += `TASK: Generate personalized interview questions based on the above information.\n\n`;
  prompt += `Generate:\n`;
  prompt += `- 5 technical questions (varying difficulty)\n`;
  prompt += `- 5 behavioral questions (different categories)\n`;
  prompt += `- 3 project-based questions (from actual resume projects)\n`;
  prompt += `- 4 follow-up questions (to deepen understanding)\n\n`;
  prompt += interviewConfig.prompts.jsonFormatInstruction;

  return prompt;
};

/**
 * Generate interview questions
 */
export const generateInterviewQuestions = async ({
  resumeId,
  userId,
  jobDescription = null,
}) => {
  const startTime = Date.now();
  const logPrefix = '[AI Interview]';

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🎯 Starting Interview Generation`);
    console.log(`${logPrefix} Resume ID: ${resumeId}`);
    console.log(`${'='.repeat(70)}\n`);

    // Step 1: Verify resume
    console.log(`${logPrefix} Step 1/5: Verifying resume...`);
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied');
    }

    console.log(`${logPrefix} ✅ Resume verified`);

    // Step 2: Get resume context using RAG
    console.log(`${logPrefix} Step 2/5: Retrieving resume context...`);
    let resumeContext = '';

    if (resume.embeddingStatus === 'completed') {
      const retrievalResult = await getContextForChat({
        resumeId: resume._id.toString(),
        query: 'skills, experience, projects, education',
        userId,
        options: {
          topK: 10,
          maxContextLength: 3000,
          includeScores: false,
          includeSections: true,
        },
      });

      resumeContext = retrievalResult.chunks
        .map((chunk) => `[${chunk.sectionName}]\n${chunk.text}`)
        .join('\n\n');
    } else {
      // Fallback to structured data
      const { structuredData } = resume;
      resumeContext = `Skills: ${structuredData?.skills?.join(', ') || 'N/A'}\n`;
      resumeContext += `Experience: ${
        structuredData?.experience?.map((e) => e.title).join(', ') || 'N/A'
      }\n`;
      resumeContext += `Projects: ${
        structuredData?.projects?.map((p) => p.name).join(', ') || 'N/A'
      }`;
    }

    console.log(`${logPrefix} ✅ Context retrieved`);

    // Step 3: Get AI analysis if available
    console.log(`${logPrefix} Step 3/5: Checking for AI analysis...`);
    const Analysis = (await import('../models/Analysis.js')).default;
    const analysis = await Analysis.findOne({ resume: resumeId })
      .sort({ createdAt: -1 })
      .limit(1);

    const aiAnalysis = analysis
      ? {
          score: analysis.score,
          skills: analysis.skills,
          experienceLevel: analysis.experienceLevel,
        }
      : null;

    console.log(`${logPrefix} ${aiAnalysis ? '✅' : '⚠️'} Analysis ${aiAnalysis ? 'found' : 'not found'}`);

    // Step 4: Build prompt and call Gemini
    console.log(`${logPrefix} Step 4/5: Generating questions...`);
    const prompt = buildInterviewPrompt({
      resumeContext,
      aiAnalysis,
      jobDescription,
    });

    const geminiStartTime = Date.now();
    const aiResponse = await callGeminiWithRetry(prompt);
    const responseTime = Date.now() - geminiStartTime;

    console.log(`${logPrefix} ✅ Questions generated (${responseTime}ms)`);

    // Validate response
    if (
      !aiResponse.technical ||
      !aiResponse.behavioral ||
      !aiResponse.projectBased ||
      !aiResponse.followUp
    ) {
      throw new Error('Invalid AI response format');
    }

    // Step 5: Save to history
    console.log(`${logPrefix} Step 5/5: Saving to history...`);
    const historyRecord = await InterviewHistory.createInterview({
      userId,
      resumeId,
      jobDescription,
      questions: aiResponse,
      metadata: {
        model: interviewConfig.gemini.model,
        tokensUsed: estimateTokens(prompt),
        responseTime,
      },
    });

    const totalTime = Date.now() - startTime;
    console.log(`\n${logPrefix} 🎉 Complete! (${totalTime}ms)\n`);

    return {
      success: true,
      data: {
        id: historyRecord._id,
        questions: aiResponse,
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
      await InterviewHistory.createErrorInterview({
        userId,
        resumeId,
        jobDescription,
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
 * Get interview history
 */
export const getInterviewHistory = async (resumeId, userId, options = {}) => {
  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) throw new Error('Resume not found');
    if (resume.user.toString() !== userId.toString()) throw new Error('Access denied');

    const history = await InterviewHistory.getResumeHistory(resumeId, options);

    return {
      success: true,
      data: { history, total: history.length, resumeId },
    };
  } catch (error) {
    console.error('[AI Interview] Error getting history:', error.message);
    throw error;
  }
};

/**
 * Get user statistics
 */
export const getUserInterviewStats = async (userId) => {
  try {
    const stats = await InterviewHistory.getUserStats(userId);
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('[AI Interview] Error getting stats:', error.message);
    throw error;
  }
};

export default {
  generateInterviewQuestions,
  getInterviewHistory,
  getUserInterviewStats,
};
