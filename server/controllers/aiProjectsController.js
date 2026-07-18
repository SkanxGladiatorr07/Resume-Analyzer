/**
 * AI Projects Controller
 * Handles HTTP requests for project suggestions generation
 */

import {
  generateProjectSuggestions,
  getProjectHistory,
  getUserProjectStats,
} from '../services/aiProjectsService.js';

/**
 * Generate project suggestions
 * POST /api/ai/projects
 */
export const generateProjects = async (req, res) => {
  try {
    const { existingSkills, missingSkills, careerGoal } = req.body;
    const userId = req.user.id;

    // Validate input
    if (
      (!existingSkills || existingSkills.length === 0) &&
      (!missingSkills || missingSkills.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'At least one skill (existing or missing) is required',
      });
    }

    // Generate projects
    const result = await generateProjectSuggestions({
      userId,
      existingSkills: existingSkills || [],
      missingSkills: missingSkills || [],
      careerGoal: careerGoal || '',
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('[Projects Controller] Error generating projects:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate project suggestions',
    });
  }
};

/**
 * Get project history
 * GET /api/ai/projects/history
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, skip } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit, 10);
    if (skip) options.skip = parseInt(skip, 10);

    const result = await getProjectHistory(userId, options);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Projects Controller] Error getting history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get project history',
    });
  }
};

/**
 * Get user statistics
 * GET /api/ai/projects/stats
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUserProjectStats(userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Projects Controller] Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get project statistics',
    });
  }
};

export default {
  generateProjects,
  getHistory,
  getStats,
};
