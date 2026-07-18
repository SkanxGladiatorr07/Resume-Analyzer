import express from 'express';
import {
  uploadResume,
  getResumes,
  deleteResume,
  getResumeRawText,
  getResumeParsedData,
  getParsingStatus,
} from '../controllers/resumeController.js';
import {
  getVersions,
  getVersion,
  compareVersions,
  cleanup,
  restore,
} from '../controllers/versionController.js';
import { authenticate } from '../middleware/auth.js';
import { validateResumeId, checkResumeOwnership } from '../middleware/resumeAuth.js';
import upload from '../config/multer.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/resumes/upload
 * @desc    Upload a resume file
 * @access  Private
 */
router.post('/upload', upload.single('resume'), uploadResume);

/**
 * @route   GET /api/resumes
 * @desc    Get all resumes for authenticated user
 * @access  Private
 */
router.get('/', getResumes);

/**
 * @route   DELETE /api/resumes/:id
 * @desc    Delete a resume
 * @access  Private
 */
router.delete('/:id', validateResumeId, checkResumeOwnership, deleteResume);

/**
 * @route   GET /api/resumes/:id/raw-text
 * @desc    Get extracted text from a resume
 * @access  Private
 */
router.get('/:id/raw-text', validateResumeId, checkResumeOwnership, getResumeRawText);

/**
 * @route   GET /api/resumes/:id/parsed
 * @desc    Get structured parsed data from a resume
 * @access  Private
 */
router.get('/:id/parsed', validateResumeId, checkResumeOwnership, getResumeParsedData);

/**
 * @route   GET /api/resumes/:id/status
 * @desc    Get parsing status of a resume
 * @access  Private
 */
router.get('/:id/status', validateResumeId, checkResumeOwnership, getParsingStatus);

/**
 * VERSION MANAGEMENT ROUTES
 */

/**
 * @route   GET /api/resumes/:id/versions
 * @desc    Get all versions for a resume
 * @query   limit, skip, includeData
 * @access  Private
 */
router.get('/:id/versions', getVersions);

/**
 * @route   GET /api/resumes/:id/versions/:versionNumber
 * @desc    Get a specific version
 * @access  Private
 */
router.get('/:id/versions/:versionNumber', getVersion);

/**
 * @route   GET /api/resumes/:id/compare/:version1/:version2
 * @desc    Compare two versions
 * @access  Private
 */
router.get('/:id/compare/:version1/:version2', compareVersions);

/**
 * @route   DELETE /api/resumes/:id/versions/cleanup
 * @desc    Cleanup old versions
 * @query   keep (default: 10)
 * @access  Private
 */
router.delete('/:id/versions/cleanup', cleanup);

/**
 * @route   POST /api/resumes/:id/versions/:versionNumber/restore
 * @desc    Restore a previous version
 * @access  Private
 */
router.post('/:id/versions/:versionNumber/restore', restore);

export default router;
