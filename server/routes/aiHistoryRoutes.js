/**
 * AI History Routes
 * Unified routes for AI generation history
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getRewriteHistory,
  getStarHistory,
  getInterviewHistory,
  getProjectsHistory,
  getRoadmapHistory,
  getAllHistory,
  regenerateFromHistory,
} from '../controllers/aiHistoryController.js';

const router = express.Router();

/**
 * @route   GET /api/ai/history/rewrite
 * @desc    Get rewrite history
 * @query   resumeId (optional), limit, skip
 * @access  Private
 */
router.get('/history/rewrite', authenticate, getRewriteHistory);

/**
 * @route   GET /api/ai/history/star
 * @desc    Get STAR history
 * @query   resumeId (optional), limit, skip
 * @access  Private
 */
router.get('/history/star', authenticate, getStarHistory);

/**
 * @route   GET /api/ai/history/interview
 * @desc    Get interview history
 * @query   resumeId (optional), limit, skip
 * @access  Private
 */
router.get('/history/interview', authenticate, getInterviewHistory);

/**
 * @route   GET /api/ai/history/projects
 * @desc    Get projects history
 * @query   limit, skip
 * @access  Private
 */
router.get('/history/projects', authenticate, getProjectsHistory);

/**
 * @route   GET /api/ai/history/roadmap
 * @desc    Get roadmap history
 * @query   type (learning|career), limit, skip
 * @access  Private
 */
router.get('/history/roadmap', authenticate, getRoadmapHistory);

/**
 * @route   GET /api/ai/history/all
 * @desc    Get all AI history combined
 * @query   limit
 * @access  Private
 */
router.get('/history/all', authenticate, getAllHistory);

/**
 * @route   POST /api/ai/history/regenerate/:feature/:id
 * @desc    Regenerate from history
 * @params  feature (rewrite|star|interview|projects|roadmap), id (history record ID)
 * @access  Private
 */
router.post('/history/regenerate/:feature/:id', authenticate, regenerateFromHistory);

export default router;
