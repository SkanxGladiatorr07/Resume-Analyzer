/**
 * Job Match Routes
 * API endpoints for resume-to-job comparison
 */

import express from 'express';
import {
  generateJobMatch,
  getJobMatch,
  getJobMatchStatus,
  deleteJobMatch,
} from '../controllers/jobMatchController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/job-match/:resumeId/:jobDescriptionId
 * @desc    Generate or retrieve job match for resume and job description
 * @access  Private
 * @query   force=true to regenerate existing match
 * @example POST /api/job-match/668f7a1b2c3d4e5f6a7b8c9d/668f7a1b2c3d4e5f6a7b8c9e
 * @example POST /api/job-match/668f7a1b2c3d4e5f6a7b8c9d/668f7a1b2c3d4e5f6a7b8c9e?force=true
 */
router.post('/:resumeId/:jobDescriptionId', generateJobMatch);

/**
 * @route   GET /api/job-match/:resumeId/:jobDescriptionId
 * @desc    Get existing job match
 * @access  Private
 * @example GET /api/job-match/668f7a1b2c3d4e5f6a7b8c9d/668f7a1b2c3d4e5f6a7b8c9e
 */
router.get('/:resumeId/:jobDescriptionId', getJobMatch);

/**
 * @route   GET /api/job-match/:resumeId/:jobDescriptionId/status
 * @desc    Get job match status
 * @access  Private
 * @example GET /api/job-match/668f7a1b2c3d4e5f6a7b8c9d/668f7a1b2c3d4e5f6a7b8c9e/status
 */
router.get('/:resumeId/:jobDescriptionId/status', getJobMatchStatus);

/**
 * @route   DELETE /api/job-match/:resumeId/:jobDescriptionId
 * @desc    Delete job match
 * @access  Private
 * @example DELETE /api/job-match/668f7a1b2c3d4e5f6a7b8c9d/668f7a1b2c3d4e5f6a7b8c9e
 */
router.delete('/:resumeId/:jobDescriptionId', deleteJobMatch);

export default router;
