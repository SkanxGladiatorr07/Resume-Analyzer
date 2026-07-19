/**
 * AI Projects Routes
 * Routes for project suggestions generation
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  generateProjects,
  getHistory,
  getStats,
} from '../controllers/aiProjectsController.js';

const router = express.Router();

/**
 * @route   POST /api/ai/projects
 * @desc    Generate project suggestions based on skills and career goals
 * @access  Private
 */
router.post('/projects', authenticate, generateProjects);

/**
 * @route   GET /api/ai/projects/history
 * @desc    Get project generation history
 * @access  Private
 */
router.get('/projects/history', authenticate, getHistory);

/**
 * @route   GET /api/ai/projects/stats
 * @desc    Get user project statistics
 * @access  Private
 */
router.get('/projects/stats', authenticate, getStats);

export default router;
