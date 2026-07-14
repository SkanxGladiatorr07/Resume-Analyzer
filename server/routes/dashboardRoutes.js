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
import {
  getAllCharts,
  getATSScoreTrend,
  getResumeUploadTimeline,
  getSkillsDistribution,
  getJobMatchScoreDistribution,
  getResumeCompletenessScore,
  getMostCommonMissingSkills,
  getATSScoreDistribution,
  getAnalysisSuccessRate,
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// DASHBOARD DATA ENDPOINTS
// ============================================================================

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

// ============================================================================
// CHART DATA ENDPOINTS
// ============================================================================

/**
 * @route   GET /api/dashboard/charts
 * @desc    Get all chart data at once
 * @access  Private
 * @query   days - Number of days for time-based charts (default: 30)
 * @query   topSkills - Number of top skills (default: 10)
 * @query   topMissingSkills - Number of top missing skills (default: 10)
 * @returns All chart data for visualizations
 * @example GET /api/dashboard/charts?days=30&topSkills=10
 */
router.get('/charts', getAllCharts);

/**
 * @route   GET /api/dashboard/charts/ats-trend
 * @desc    Get ATS score trend over time
 * @access  Private
 * @query   days - Number of days to look back (default: 30, max: 365)
 * @returns ATS score trend data
 * @example GET /api/dashboard/charts/ats-trend?days=30
 */
router.get('/charts/ats-trend', getATSScoreTrend);

/**
 * @route   GET /api/dashboard/charts/upload-timeline
 * @desc    Get resume upload timeline
 * @access  Private
 * @query   days - Number of days to look back (default: 30, max: 365)
 * @returns Resume upload timeline data
 * @example GET /api/dashboard/charts/upload-timeline?days=30
 */
router.get('/charts/upload-timeline', getResumeUploadTimeline);

/**
 * @route   GET /api/dashboard/charts/skills-distribution
 * @desc    Get skills frequency distribution
 * @access  Private
 * @query   limit - Number of top skills (default: 10, max: 50)
 * @returns Skills distribution data
 * @example GET /api/dashboard/charts/skills-distribution?limit=10
 */
router.get('/charts/skills-distribution', getSkillsDistribution);

/**
 * @route   GET /api/dashboard/charts/match-distribution
 * @desc    Get job match score distribution
 * @access  Private
 * @returns Job match score distribution by ranges
 * @example GET /api/dashboard/charts/match-distribution
 */
router.get('/charts/match-distribution', getJobMatchScoreDistribution);

/**
 * @route   GET /api/dashboard/charts/completeness
 * @desc    Get resume completeness scores
 * @access  Private
 * @returns Resume completeness scores for all resumes
 * @example GET /api/dashboard/charts/completeness
 */
router.get('/charts/completeness', getResumeCompletenessScore);

/**
 * @route   GET /api/dashboard/charts/missing-skills
 * @desc    Get most common missing skills
 * @access  Private
 * @query   limit - Number of top skills (default: 10, max: 50)
 * @returns Most frequently missing skills from job matches
 * @example GET /api/dashboard/charts/missing-skills?limit=10
 */
router.get('/charts/missing-skills', getMostCommonMissingSkills);

/**
 * @route   GET /api/dashboard/charts/ats-distribution
 * @desc    Get ATS score distribution
 * @access  Private
 * @returns ATS score distribution by ranges
 * @example GET /api/dashboard/charts/ats-distribution
 */
router.get('/charts/ats-distribution', getATSScoreDistribution);

/**
 * @route   GET /api/dashboard/charts/success-rate
 * @desc    Get analysis success rate over time
 * @access  Private
 * @query   days - Number of days to look back (default: 30, max: 365)
 * @returns Analysis success rate data
 * @example GET /api/dashboard/charts/success-rate?days=30
 */
router.get('/charts/success-rate', getAnalysisSuccessRate);

export default router;
