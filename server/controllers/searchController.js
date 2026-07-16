/**
 * Search Controller
 * Handles HTTP requests for semantic search functionality
 * 
 * @module controllers/searchController
 */

import {
  searchResume,
  searchMultipleResumes,
  getSearchSuggestions,
  getSearchStats,
} from '../services/searchService.js';

/**
 * @desc    Search resume by semantic similarity
 * @route   POST /api/search
 * @access  Private
 * 
 * @body {
 *   resumeId: string (required),
 *   query: string (required),
 *   topK: number (optional, default: 5, max: 20),
 *   sections: string[] (optional)
 * }
 */
export const searchResumeController = async (req, res) => {
  try {
    const { resumeId, query, topK, sections } = req.body;

    // Validate required fields
    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required',
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Get user ID from authenticated request
    const userId = req.user._id.toString();

    // Perform search
    const result = await searchResume({
      resumeId,
      query,
      userId,
      options: {
        topK,
        sections,
      },
    });

    // Return results
    res.json(result);
  } catch (error) {
    console.error('[SearchController] Error:', error.message);

    // Handle specific error cases
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

    if (
      error.message.includes('pending') ||
      error.message.includes('processing') ||
      error.message.includes('failed')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
        hint: 'Wait for embedding generation to complete before searching',
      });
    }

    if (
      error.message.includes('Query') ||
      error.message.includes('empty') ||
      error.message.includes('characters')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'An error occurred while searching',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Search across multiple resumes
 * @route   POST /api/search/multiple
 * @access  Private
 * 
 * @body {
 *   query: string (required),
 *   topK: number (optional, default: 5),
 *   resumeIds: string[] (optional, defaults to all user resumes)
 * }
 */
export const searchMultipleResumesController = async (req, res) => {
  try {
    const { query, topK, resumeIds } = req.body;

    // Validate required fields
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Get user ID from authenticated request
    const userId = req.user._id.toString();

    // Perform search
    const result = await searchMultipleResumes({
      query,
      userId,
      options: {
        topK,
        resumeIds,
      },
    });

    // Return results
    res.json(result);
  } catch (error) {
    console.error('[SearchController] Multi-search error:', error.message);

    if (
      error.message.includes('Query') ||
      error.message.includes('empty') ||
      error.message.includes('characters')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while searching',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get search suggestions for a resume
 * @route   GET /api/search/suggestions/:resumeId
 * @access  Private
 */
export const getSearchSuggestionsController = async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required',
      });
    }

    const userId = req.user._id.toString();

    const suggestions = await getSearchSuggestions(resumeId, userId);

    res.json(suggestions);
  } catch (error) {
    console.error('[SearchController] Suggestions error:', error.message);

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

    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get search statistics for a resume
 * @route   GET /api/search/stats/:resumeId
 * @access  Private
 */
export const getSearchStatsController = async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required',
      });
    }

    const userId = req.user._id.toString();

    const stats = await getSearchStats(resumeId, userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[SearchController] Stats error:', error.message);

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

    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default {
  searchResumeController,
  searchMultipleResumesController,
  getSearchSuggestionsController,
  getSearchStatsController,
};
