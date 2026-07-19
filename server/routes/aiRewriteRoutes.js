/**
 * AI Rewrite Routes
 * Routes for AI resume rewriting functionality
 * 
 * @module routes/aiRewriteRoutes
 */

import express from 'express';
import {
  rewriteResumeContent,
  getHistory,
  getStats,
  getRewriteConfig,
} from '../controllers/aiRewriteController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/ai/rewrite
 * @desc    Rewrite resume content using AI
 * @access  Private
 * 
 * @body    {resumeId, section, content, tone}
 * @returns {rewrittenContent, improvements, metadata}
 */
router.post('/rewrite', authenticate, rewriteResumeContent);

/**
 * @route   GET /api/ai/rewrite/history/:resumeId
 * @desc    Get rewrite history for a resume
 * @access  Private
 * 
 * @params  resumeId - Resume ID
 * @query   section - Filter by section (optional)
 * @query   limit - Number of records (default: 20)
 * @query   skip - Number to skip (default: 0)
 * @returns {history, total, resumeId}
 */
router.get('/rewrite/history/:resumeId', authenticate, getHistory);

/**
 * @route   GET /api/ai/rewrite/stats
 * @desc    Get user's rewrite statistics
 * @access  Private
 * 
 * @returns {totalRewrites, sectionsRewritten, tonesUsed, averageResponseTime}
 */
router.get('/rewrite/stats', authenticate, getStats);

/**
 * @route   GET /api/ai/rewrite/config
 * @desc    Get rewrite configuration
 * @access  Private
 * 
 * @returns {supportedSections, supportedTones, contentLimits}
 */
router.get('/rewrite/config', authenticate, getRewriteConfig);

export default router;
