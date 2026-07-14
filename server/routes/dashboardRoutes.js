/**
 * Dashboard Routes
 * API endpoints for dashboard analytics and statistics
 */

import express from 'express';
import {
  getDashboard,
  getDashboardOverview,
  getDashboardActivity,
  getDashboardStatus,
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard
 * @desc    Get comprehensive dashboard data
 * @access  Private
 * @returns Complete dashboard including overview, latest items, status breakdowns, and recent activity
 * @example GET /api/dashboard
 */
router.get('/', getDashboard);

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get overview statistics only (faster than full dashboard)
 * @access  Private
 * @returns Overview metrics: totals, averages, highest scores
 * @example GET /api/dashboard/overview
 */
router.get('/overview', getDashboardOverview);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent activity timeline
 * @access  Private
 * @query   limit - Number of activities to return (default: 10, max: 50)
 * @returns Array of recent activities
 * @example GET /api/dashboard/activity?limit=20
 */
router.get('/activity', getDashboardActivity);

/**
 * @route   GET /api/dashboard/status
 * @desc    Get status breakdowns for all resources
 * @access  Private
 * @returns Status counts for resumes, analyses, and job matches
 * @example GET /api/dashboard/status
 */
router.get('/status', getDashboardStatus);

export default router;
