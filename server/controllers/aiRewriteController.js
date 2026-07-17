/**
 * AI Rewrite Controller
 * Handles HTTP requests for AI resume rewriting
 * 
 * @module controllers/aiRewriteController
 */

import {
  rewriteContent,
  getRewriteHistory,
  getUserRewriteStats,
} from '../services/aiRewriteService.js';

/**
 * Rewrite resume content
 * POST /api/ai/rewrite
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const rewriteResumeContent = async (req, res) => {
  try {
    const { resumeId, section, content, tone } = req.body;
    const userId = req.user.id;

    // Validate request body
    if (!resumeId || !section || !content || !tone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: resumeId, section, content, tone',
      });
    }

    // Call service
    const result = await rewriteContent({
      resumeId,
      userId,
      section,
      content,
      tone,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Rewrite Controller] Error:', error.message);

    // Handle specific errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      message: 'Failed to rewrite content. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get rewrite history for a resume
 * GET /api/ai/rewrite/history/:resumeId
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getHistory = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.id;
    const { section, limit, skip } = req.query;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required',
      });
    }

    const options = {
      section,
      limit: limit ? parseInt(limit) : 20,
      skip: skip ? parseInt(skip) : 0,
    };

    const result = await getRewriteHistory(resumeId, userId, options);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Rewrite Controller] Error getting history:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to get rewrite history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get user rewrite statistics
 * GET /api/ai/rewrite/stats
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUserRewriteStats(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Rewrite Controller] Error getting stats:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to get rewrite statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get rewrite configuration
 * GET /api/ai/rewrite/config
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getRewriteConfig = async (req, res) => {
  try {
    const config = {
      supportedSections: ['summary', 'experience', 'projects', 'skills'],
      supportedTones: ['professional', 'technical', 'leadership', 'concise'],
      contentLimits: {
        minLength: 10,
        maxLength: 5000,
      },
    };

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('[Rewrite Controller] Error getting config:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to get configuration',
    });
  }
};

export default {
  rewriteResumeContent,
  getHistory,
  getStats,
  getRewriteConfig,
};
