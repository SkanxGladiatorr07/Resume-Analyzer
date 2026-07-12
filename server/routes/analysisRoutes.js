/**
 * Analysis Routes
 * API endpoints for resume analysis generation and retrieval
 */

import express from 'express';
import {
  generateAnalysis,
  getAnalysis,
  deleteAnalysis,
  checkAnalysisExists,
} from '../controllers/analysisController.js';
import { authenticate } from '../middleware/auth.js';
import { validateResumeId, checkResumeOwnership } from '../middleware/resumeAuth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/analysis/:resumeId
 * @desc    Generate or retrieve analysis for a resume
 * @query   force=true to regenerate existing analysis
 * @access  Private
 * @example POST /api/analysis/668f7a1b2c3d4e5f6a7b8c9d
 * @example POST /api/analysis/668f7a1b2c3d4e5f6a7b8c9d?force=true
 */
router.post('/:resumeId', validateResumeId, checkResumeOwnership, generateAnalysis);

/**
 * @route   GET /api/analysis/:resumeId
 * @desc    Get existing analysis for a resume
 * @access  Private
 * @example GET /api/analysis/668f7a1b2c3d4e5f6a7b8c9d
 */
router.get('/:resumeId', validateResumeId, checkResumeOwnership, getAnalysis);

/**
 * @route   DELETE /api/analysis/:resumeId
 * @desc    Delete analysis for a resume
 * @access  Private
 * @example DELETE /api/analysis/668f7a1b2c3d4e5f6a7b8c9d
 */
router.delete('/:resumeId', validateResumeId, checkResumeOwnership, deleteAnalysis);

/**
 * @route   GET /api/analysis/:resumeId/exists
 * @desc    Check if analysis exists for a resume
 * @access  Private
 * @example GET /api/analysis/668f7a1b2c3d4e5f6a7b8c9d/exists
 */
router.get('/:resumeId/exists', validateResumeId, checkResumeOwnership, checkAnalysisExists);

export default router;
