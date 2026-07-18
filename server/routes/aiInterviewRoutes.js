/**
 * AI Interview Routes
 * Routes for interview question generation
 */

import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  generateInterview,
  getHistory,
  getStats,
} from '../controllers/aiInterviewController.js';

const router = express.Router();

/**
 * @route   POST /api/ai/interview
 * @desc    Generate interview questions based on resume and job description
 * @access  Private
 */
router.post('/interview', authenticate, generateInterview);

/**
 * @route   GET /api/ai/interview/history/:resumeId
 * @desc    Get interview history for a resume
 * @access  Private
 */
router.get('/interview/history/:resumeId', authenticate, getHistory);

/**
 * @route   GET /api/ai/interview/stats
 * @desc    Get user interview statistics
 * @access  Private
 */
router.get('/interview/stats', authenticate, getStats);

export default router;
