/**
 * Version Routes
 * Routes for resume version management and comparison
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getVersions,
  getVersion,
  compareVersions,
  cleanup,
  restore,
} from '../controllers/versionController.js';

const router = express.Router();

/**
 * @route   GET /api/resumes/:id/versions
 * @desc    Get all versions for a resume
 * @query   limit (default: 50), skip (default: 0), includeData (boolean)
 * @access  Private
 */
router.get('/:id/versions', authenticate, getVersions);

/**
 * @route   GET /api/resumes/:id/versions/:versionNumber
 * @desc    Get a specific version
 * @access  Private
 */
router.get('/:id/versions/:versionNumber', authenticate, getVersion);

/**
 * @route   GET /api/resumes/:id/compare/:version1/:version2
 * @desc    Compare two versions
 * @access  Private
 */
router.get('/:id/compare/:version1/:version2', authenticate, compareVersions);

/**
 * @route   DELETE /api/resumes/:id/versions/cleanup
 * @desc    Cleanup old versions (keep latest N)
 * @query   keep (default: 10) - Number of versions to keep
 * @access  Private
 */
router.delete('/:id/versions/cleanup', authenticate, cleanup);

/**
 * @route   POST /api/resumes/:id/versions/:versionNumber/restore
 * @desc    Restore a previous version as current
 * @access  Private
 */
router.post('/:id/versions/:versionNumber/restore', authenticate, restore);

export default router;
