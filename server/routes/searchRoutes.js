/**
 * Search Routes
 * Routes for semantic search functionality
 * 
 * @module routes/searchRoutes
 */

import express from 'express';
import {
  searchResumeController,
  searchMultipleResumesController,
  getSearchSuggestionsController,
  getSearchStatsController,
} from '../controllers/searchController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All search routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/search
 * @desc    Search a specific resume by semantic similarity
 * @access  Private
 * 
 * @body {
 *   resumeId: string (required) - Resume identifier
 *   query: string (required) - Search query
 *   topK: number (optional) - Number of results (default: 5, max: 20)
 *   sections: string[] (optional) - Filter by sections
 * }
 * 
 * @example
 * POST /api/search
 * {
 *   "resumeId": "65abc123def456",
 *   "query": "Python machine learning experience",
 *   "topK": 5
 * }
 * 
 * @returns {
 *   success: boolean,
 *   query: string,
 *   resumeId: string,
 *   fileName: string,
 *   totalResults: number,
 *   results: [
 *     {
 *       chunkId: string,
 *       score: number,
 *       sectionName: string,
 *       text: string,
 *       chunkIndex: number,
 *       subsection: string,
 *       metadata: object
 *     }
 *   ],
 *   metadata: object
 * }
 */
router.post('/', searchResumeController);

/**
 * @route   POST /api/search/multiple
 * @desc    Search across multiple resumes
 * @access  Private
 * 
 * @body {
 *   query: string (required) - Search query
 *   topK: number (optional) - Results per resume (default: 5)
 *   resumeIds: string[] (optional) - Specific resumes to search
 * }
 * 
 * @example
 * POST /api/search/multiple
 * {
 *   "query": "software engineering",
 *   "topK": 3
 * }
 * 
 * @returns {
 *   success: boolean,
 *   query: string,
 *   totalResumes: number,
 *   results: [
 *     {
 *       resumeId: string,
 *       fileName: string,
 *       totalResults: number,
 *       results: array
 *     }
 *   ],
 *   metadata: object
 * }
 */
router.post('/multiple', searchMultipleResumesController);

/**
 * @route   GET /api/search/suggestions/:resumeId
 * @desc    Get search suggestions for a resume
 * @access  Private
 * 
 * @params {
 *   resumeId: string - Resume identifier
 * }
 * 
 * @example
 * GET /api/search/suggestions/65abc123def456
 * 
 * @returns {
 *   success: boolean,
 *   resumeId: string,
 *   sections: [
 *     {
 *       section: string,
 *       chunkCount: number,
 *       suggestedQueries: string[]
 *     }
 *   ],
 *   totalSections: number
 * }
 */
router.get('/suggestions/:resumeId', getSearchSuggestionsController);

/**
 * @route   GET /api/search/stats/:resumeId
 * @desc    Get search statistics for a resume
 * @access  Private
 * 
 * @params {
 *   resumeId: string - Resume identifier
 * }
 * 
 * @example
 * GET /api/search/stats/65abc123def456
 * 
 * @returns {
 *   success: boolean,
 *   stats: {
 *     resumeId: string,
 *     fileName: string,
 *     embeddingStatus: string,
 *     totalChunks: number,
 *     sections: object,
 *     searchable: boolean
 *   }
 * }
 */
router.get('/stats/:resumeId', getSearchStatsController);

export default router;
