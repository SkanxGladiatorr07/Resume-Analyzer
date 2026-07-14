/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard analytics and statistics
 */

import * as dashboardService from '../services/dashboardService.js';
import * as responseUtils from '../utils/responseUtils.js';

/**
 * @desc    Get comprehensive dashboard analytics
 * @route   GET /api/dashboard
 * @access  Private - Requires authentication
 * @returns Dashboard data including:
 *          - Total resumes, analyses, and job matches
 *          - Average and highest ATS scores
 *          - Latest resume, analysis, and job match
 *          - Status breakdowns for all resources
 *          - Recent activity timeline
 */
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`\n📊 Dashboard request received - User: ${userId}`);

    // Get aggregated dashboard data
    const dashboardData = await dashboardService.getDashboardData(userId);

    console.log(`✅ Dashboard data generated successfully`);

    return responseUtils.sendSuccess(
      res,
      dashboardData,
      'Dashboard data retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Dashboard controller error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve dashboard data'
    );
  }
};

/**
 * @desc    Get overview statistics only
 * @route   GET /api/dashboard/overview
 * @access  Private - Requires authentication
 * @returns Overview metrics (totals, averages, highest scores)
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`📊 Dashboard overview request - User: ${userId}`);

    // Get only overview metrics (faster than full dashboard)
    const [
      totalResumes,
      totalAnalyses,
      totalJobMatches,
      averageATSScore,
      highestATSScore,
      averageMatchScore,
    ] = await Promise.all([
      dashboardService.getTotalResumes(userId),
      dashboardService.getTotalAnalyses(userId),
      dashboardService.getTotalJobMatches(userId),
      dashboardService.getAverageATSScore(userId),
      dashboardService.getHighestATSScore(userId),
      dashboardService.getAverageMatchScore(userId),
    ]);

    const overview = {
      totalResumes,
      totalAnalyses,
      totalJobMatches,
      averageATSScore,
      highestATSScore,
      averageMatchScore,
    };

    console.log(`✅ Overview generated - Resumes: ${totalResumes}, Analyses: ${totalAnalyses}`);

    return responseUtils.sendSuccess(
      res,
      overview,
      'Dashboard overview retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Dashboard overview error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve dashboard overview'
    );
  }
};

/**
 * @desc    Get recent activity timeline
 * @route   GET /api/dashboard/activity
 * @query   limit - Number of activities to return (default: 10, max: 50)
 * @access  Private - Requires authentication
 * @returns Recent activity timeline
 */
export const getDashboardActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 50);

    console.log(`📊 Dashboard activity request - User: ${userId}, Limit: ${limit}`);

    const recentActivity = await dashboardService.getRecentActivity(userId, limit);

    console.log(`✅ Activity retrieved - ${recentActivity.length} items`);

    return responseUtils.sendSuccess(
      res,
      recentActivity,
      'Recent activity retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Dashboard activity error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve recent activity'
    );
  }
};

/**
 * @desc    Get status breakdowns
 * @route   GET /api/dashboard/status
 * @access  Private - Requires authentication
 * @returns Status breakdowns for resumes, analyses, and job matches
 */
export const getDashboardStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`📊 Dashboard status request - User: ${userId}`);

    const [
      resumeStatusBreakdown,
      analysisStatusBreakdown,
      jobMatchStatusBreakdown,
    ] = await Promise.all([
      dashboardService.getResumeStatusBreakdown(userId),
      dashboardService.getAnalysisStatusBreakdown(userId),
      dashboardService.getJobMatchStatusBreakdown(userId),
    ]);

    const statusBreakdown = {
      resumes: resumeStatusBreakdown,
      analyses: analysisStatusBreakdown,
      jobMatches: jobMatchStatusBreakdown,
    };

    console.log(`✅ Status breakdown generated`);

    return responseUtils.sendSuccess(
      res,
      statusBreakdown,
      'Status breakdown retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Dashboard status error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve status breakdown'
    );
  }
};
