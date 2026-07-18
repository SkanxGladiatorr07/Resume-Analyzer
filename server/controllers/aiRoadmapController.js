/**
 * AI Roadmap Controller
 * Handles HTTP requests for learning and career roadmap generation
 */

import {
  generateLearningRoadmap,
  generateCareerRoadmap,
  getRoadmapHistory,
  getUserRoadmapStats,
} from '../services/aiRoadmapService.js';

/**
 * Generate learning roadmap
 * POST /api/ai/roadmap/learning
 */
export const generateLearning = async (req, res) => {
  try {
    const { currentSkills, targetRole, timeframe } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Target role is required',
      });
    }

    // Generate roadmap
    const result = await generateLearningRoadmap({
      userId,
      currentSkills: currentSkills || [],
      targetRole,
      timeframe: timeframe || '6 months',
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('[Roadmap Controller] Error generating learning roadmap:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate learning roadmap',
    });
  }
};

/**
 * Generate career roadmap
 * POST /api/ai/roadmap/career
 */
export const generateCareer = async (req, res) => {
  try {
    const { currentRole, targetCareerRole, yearsOfExperience } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentRole) {
      return res.status(400).json({
        success: false,
        message: 'Current role is required',
      });
    }

    if (!targetCareerRole) {
      return res.status(400).json({
        success: false,
        message: 'Target career role is required',
      });
    }

    // Generate roadmap
    const result = await generateCareerRoadmap({
      userId,
      currentRole,
      targetCareerRole,
      yearsOfExperience: yearsOfExperience || 0,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('[Roadmap Controller] Error generating career roadmap:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate career roadmap',
    });
  }
};

/**
 * Get roadmap history
 * GET /api/ai/roadmap/history
 * Optional query param: type (learning or career)
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit, skip } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit, 10);
    if (skip) options.skip = parseInt(skip, 10);

    const result = await getRoadmapHistory(userId, type, options);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Roadmap Controller] Error getting history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get roadmap history',
    });
  }
};

/**
 * Get user statistics
 * GET /api/ai/roadmap/stats
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUserRoadmapStats(userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Roadmap Controller] Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get roadmap statistics',
    });
  }
};

export default {
  generateLearning,
  generateCareer,
  getHistory,
  getStats,
};
