/**
 * AI Interview Controller
 * Handles HTTP requests for interview question generation
 */

import {
  generateInterviewQuestions,
  getInterviewHistory,
  getUserInterviewStats,
} from '../services/aiInterviewService.js';

/**
 * Generate interview questions
 * POST /api/ai/interview
 */
export const generateInterview = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required',
      });
    }

    // Generate questions
    const result = await generateInterviewQuestions({
      resumeId,
      userId,
      jobDescription,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('[Interview Controller] Error generating interview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate interview questions',
    });
  }
};

/**
 * Get interview history for a resume
 * GET /api/ai/interview/history/:resumeId
 */
export const getHistory = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.id;
    const { limit, skip } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit, 10);
    if (skip) options.skip = parseInt(skip, 10);

    const result = await getInterviewHistory(resumeId, userId, options);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Interview Controller] Error getting history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get interview history',
    });
  }
};

/**
 * Get user statistics
 * GET /api/ai/interview/stats
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUserInterviewStats(userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Interview Controller] Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get interview statistics',
    });
  }
};

export default {
  generateInterview,
  getHistory,
  getStats,
};
