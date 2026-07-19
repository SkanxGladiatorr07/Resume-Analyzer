/**
 * AI STAR Routes
 * Routes for STAR bullet generation functionality
 * 
 * @module routes/aiStarRoutes
 */

import express from 'express';
import {
  generateStar,
  getHistory,
  getStats,
  getStarConfig,
} from '../controllers/aiStarController.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/ai/star
 * @desc    Generate STAR-formatted bullet point with rate limiting
 * @access  Private
 * 
 * @body    {resumeId, experience}
 * @returns {original, starVersion, breakdown: {situation, task, action, result}}
 */
router.post('/star', authenticate, aiLimiter, generateStar);

/**
 * @route   GET /api/ai/star/history/:resumeId
 * @desc    Get STAR generation history for a resume
 * @access  Private
 * 
 * @params  resumeId - Resume ID
 * @query   limit - Number of records (default: 20)
 * @query   skip - Number to skip (default: 0)
 * @returns {history, total, resumeId}
 */
router.get('/star/history/:resumeId', authenticate, getHistory);

/**
 * @route   GET /api/ai/star/stats
 * @desc    Get user's STAR generation statistics
 * @access  Private
 * 
 * @returns {totalGenerated, averageOriginalLength, averageStarLength, averageResponseTime}
 */
router.get('/star/stats', authenticate, getStats);

/**
 * @route   GET /api/ai/star/config
 * @desc    Get STAR guidelines and configuration
 * @access  Private
 * 
 * @returns {contentLimits, starGuidelines}
 */
router.get('/star/config', authenticate, getStarConfig);

export default router;
