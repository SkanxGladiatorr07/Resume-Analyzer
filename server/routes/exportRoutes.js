/**
 * Export Routes
 * Handles PDF export endpoints
 */

import express from 'express';
import {
  exportPDFReport,
  getUserExportHistory,
  getUserExportStats,
} from '../controllers/exportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/report/export
 * @desc    Generate and download PDF report
 * @body    { resumeId: string, includeJobMatch?: boolean }
 * @access  Private
 */
router.post('/export', exportPDFReport);

/**
 * @route   GET /api/report/export/history
 * @desc    Get export history for authenticated user
 * @query   limit, skip
 * @access  Private
 */
router.get('/export/history', getUserExportHistory);

/**
 * @route   GET /api/report/export/stats
 * @desc    Get export statistics for authenticated user
 * @access  Private
 */
router.get('/export/stats', getUserExportStats);

export default router;
