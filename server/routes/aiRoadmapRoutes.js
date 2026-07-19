/**
 * AI Roadmap Routes
 * Routes for learning and career roadmap generation
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import {
  generateLearning,
  generateCareer,
  getHistory,
  getStats,
} from '../controllers/aiRoadmapController.js';

const router = express.Router();

/**
 * @route   POST /api/ai/roadmap/learning
 * @desc    Generate learning roadmap with rate limiting
 * @access  Private
 */
router.post('/roadmap/learning', authenticate, aiLimiter, generateLearning);

/**
 * @route   POST /api/ai/roadmap/career
 * @desc    Generate career roadmap with rate limiting
 * @access  Private
 */
router.post('/roadmap/career', authenticate, aiLimiter, generateCareer);

/**
 * @route   GET /api/ai/roadmap/history
 * @desc    Get roadmap history (optional query param: type)
 * @access  Private
 */
router.get('/roadmap/history', authenticate, getHistory);

/**
 * @route   GET /api/ai/roadmap/stats
 * @desc    Get user roadmap statistics
 * @access  Private
 */
router.get('/roadmap/stats', authenticate, getStats);

export default router;
