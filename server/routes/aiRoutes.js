/**
 * AI Analysis Routes
 * API endpoints for AI-powered resume analysis
 */

import express from 'express';
import {
  analyzeResume,
  analyzeATSScore,
  analyzeSkillGap,
  generateImprovements,
  extractKeywords,
  getAIStatus,
  testAI,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import { validateResumeId, checkResumeOwnership } from '../middleware/resumeAuth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/ai/status
 * @desc    Get AI service status
 * @access  Private
 */
router.get('/status', getAIStatus);

/**
 * @route   GET /api/ai/test
 * @desc    Test AI connection
 * @access  Private
 */
router.get('/test', testAI);

/**
 * @route   POST /api/ai/analyze/:id
 * @desc    Perform comprehensive resume analysis
 * @access  Private
 */
router.post('/analyze/:id', validateResumeId, checkResumeOwnership, analyzeResume);

/**
 * @route   POST /api/ai/ats-score/:id
 * @desc    Analyze ATS compatibility
 * @access  Private
 */
router.post('/ats-score/:id', validateResumeId, checkResumeOwnership, analyzeATSScore);

/**
 * @route   POST /api/ai/skill-gap/:id
 * @desc    Analyze skill gaps for target role
 * @access  Private
 * @body    { targetRole?: string }
 */
router.post('/skill-gap/:id', validateResumeId, checkResumeOwnership, analyzeSkillGap);

/**
 * @route   POST /api/ai/improvements/:id
 * @desc    Generate improvement suggestions
 * @access  Private
 */
router.post('/improvements/:id', validateResumeId, checkResumeOwnership, generateImprovements);

/**
 * @route   POST /api/ai/keywords/:id
 * @desc    Extract and analyze keywords
 * @access  Private
 * @body    { jobDescription?: string }
 */
router.post('/keywords/:id', validateResumeId, checkResumeOwnership, extractKeywords);

export default router;
