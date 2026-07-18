/**
 * AI STAR Controller
 * Handles HTTP requests for STAR bullet generation
 * 
 * @module controllers/aiStarController
 */

import {
  generateStarBullet,
  getStarHistory,
  getUserStarStats,
} from '../services/aiStarService.js';

/**
 * Generate STAR bullet point
 * POST /api/ai/star
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const generateStar = async (req, res) => {
  try {
    const { resumeId, experience } = req.body;
    const userId = req.user.id;

    // Validate request body
    if (!resumeId || !experience) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: resumeId, experience',
      });
    }

    // Call service
    const result = await generateStarBullet({
      resumeId,
      userId,
      experience,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[STAR Controller] Error:', error.message);

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
      message: 'Failed to generate STAR bullet. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get STAR history for a resume
 * GET /api/ai/star/history/:resumeId
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getHistory = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.id;
    const { limit, skip } = req.query;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required',
      });
    }

    const options = {
      limit: limit ? parseInt(limit) : 20,
      skip: skip ? parseInt(skip) : 0,
    };

    const result = await getStarHistory(resumeId, userId, options);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[STAR Controller] Error getting history:', error.message);

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
      message: 'Failed to get STAR history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get user STAR statistics
 * GET /api/ai/star/stats
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUserStarStats(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[STAR Controller] Error getting stats:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to get STAR statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get STAR configuration/guidelines
 * GET /api/ai/star/config
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getStarConfig = async (req, res) => {
  try {
    const config = {
      contentLimits: {
        minLength: 15,
        maxLength: 2000,
      },
      starGuidelines: {
        situation: {
          description: 'Context and background',
          tips: [
            'Describe the context or challenge',
            'Set the scene briefly',
            'Include relevant background',
          ],
        },
        task: {
          description: 'Your responsibility or goal',
          tips: [
            'What was your specific responsibility?',
            'What was the goal or objective?',
            'What problem needed solving?',
          ],
        },
        action: {
          description: 'What you did',
          tips: [
            'Use strong action verbs',
            'Describe specific steps taken',
            'Highlight your contributions',
            'Mention tools/technologies used',
          ],
        },
        result: {
          description: 'Measurable outcome or impact',
          tips: [
            'Quantify the impact (%, $, #, time)',
            'Show measurable improvements',
            'Highlight business value',
            'Use specific metrics from original content',
          ],
        },
      },
    };

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('[STAR Controller] Error getting config:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to get configuration',
    });
  }
};

export default {
  generateStar,
  getHistory,
  getStats,
  getStarConfig,
};
