/**
 * Analytics Controller
 * Handles HTTP requests for chart data and visualizations
 */

import * as analyticsService from '../services/analyticsService.js';
import * as responseUtils from '../utils/responseUtils.js';

/**
 * @desc    Get all chart data
 * @route   GET /api/dashboard/charts
 * @query   days - Number of days for time-based charts (default: 30)
 * @query   topSkills - Number of top skills to return (default: 10)
 * @query   topMissingSkills - Number of top missing skills (default: 10)
 * @access  Private - Requires authentication
 * @returns All chart data including trends, distributions, and timelines
 */
export const getAllCharts = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      days = 30,
      topSkills = 10,
      topMissingSkills = 10
    } = req.query;

    // Validate and sanitize parameters
    const options = {
      days: Math.min(Math.max(1, parseInt(days)), 365),
      topSkills: Math.min(Math.max(1, parseInt(topSkills)), 50),
      topMissingSkills: Math.min(Math.max(1, parseInt(topMissingSkills)), 50),
    };

    console.log(`\n📊 All charts request - User: ${userId}, Options:`, options);

    const chartData = await analyticsService.getAllChartData(userId, options);

    console.log(`✅ All charts generated successfully`);

    return responseUtils.sendSuccess(
      res,
      chartData,
      'Chart data retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get all charts error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve chart data'
    );
  }
};

/**
 * @desc    Get ATS Score Trend
 * @route   GET /api/dashboard/charts/ats-trend
 * @query   days - Number of days to look back (default: 30)
 * @access  Private - Requires authentication
 * @returns ATS score trend over time
 */
export const getATSScoreTrend = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = Math.min(Math.max(1, parseInt(req.query.days) || 30), 365);

    console.log(`📈 ATS Score Trend request - User: ${userId}, Days: ${days}`);

    const trendData = await analyticsService.getATSScoreTrend(userId, days);

    console.log(`✅ ATS Score Trend generated - ${trendData.labels.length} data points`);

    return responseUtils.sendSuccess(
      res,
      trendData,
      'ATS score trend retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get ATS trend error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve ATS score trend'
    );
  }
};

/**
 * @desc    Get Resume Upload Timeline
 * @route   GET /api/dashboard/charts/upload-timeline
 * @query   days - Number of days to look back (default: 30)
 * @access  Private - Requires authentication
 * @returns Resume upload timeline
 */
export const getResumeUploadTimeline = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = Math.min(Math.max(1, parseInt(req.query.days) || 30), 365);

    console.log(`📅 Resume Upload Timeline request - User: ${userId}, Days: ${days}`);

    const timelineData = await analyticsService.getResumeUploadTimeline(userId, days);

    console.log(`✅ Upload Timeline generated - ${timelineData.labels.length} data points`);

    return responseUtils.sendSuccess(
      res,
      timelineData,
      'Resume upload timeline retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get upload timeline error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve upload timeline'
    );
  }
};

/**
 * @desc    Get Skills Distribution
 * @route   GET /api/dashboard/charts/skills-distribution
 * @query   limit - Number of top skills (default: 10, max: 50)
 * @access  Private - Requires authentication
 * @returns Skills frequency distribution
 */
export const getSkillsDistribution = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 50);

    console.log(`📊 Skills Distribution request - User: ${userId}, Limit: ${limit}`);

    const skillsData = await analyticsService.getSkillsDistribution(userId, limit);

    console.log(`✅ Skills Distribution generated - ${skillsData.labels.length} skills`);

    return responseUtils.sendSuccess(
      res,
      skillsData,
      'Skills distribution retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get skills distribution error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve skills distribution'
    );
  }
};

/**
 * @desc    Get Job Match Score Distribution
 * @route   GET /api/dashboard/charts/match-distribution
 * @access  Private - Requires authentication
 * @returns Job match score distribution by ranges
 */
export const getJobMatchScoreDistribution = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`📊 Job Match Distribution request - User: ${userId}`);

    const distributionData = await analyticsService.getJobMatchScoreDistribution(userId);

    console.log(`✅ Match Distribution generated - ${distributionData.labels.length} ranges`);

    return responseUtils.sendSuccess(
      res,
      distributionData,
      'Job match distribution retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get match distribution error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve match distribution'
    );
  }
};

/**
 * @desc    Get Resume Completeness Score
 * @route   GET /api/dashboard/charts/completeness
 * @access  Private - Requires authentication
 * @returns Resume completeness scores for all user resumes
 */
export const getResumeCompletenessScore = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`📊 Resume Completeness request - User: ${userId}`);

    const completenessData = await analyticsService.getResumeCompletenessScore(userId);

    console.log(`✅ Completeness scores generated - ${completenessData.labels.length} resumes`);

    return responseUtils.sendSuccess(
      res,
      completenessData,
      'Resume completeness scores retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get completeness scores error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve completeness scores'
    );
  }
};

/**
 * @desc    Get Most Common Missing Skills
 * @route   GET /api/dashboard/charts/missing-skills
 * @query   limit - Number of top missing skills (default: 10, max: 50)
 * @access  Private - Requires authentication
 * @returns Most frequently missing skills from job matches
 */
export const getMostCommonMissingSkills = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 50);

    console.log(`📊 Missing Skills request - User: ${userId}, Limit: ${limit}`);

    const missingSkillsData = await analyticsService.getMostCommonMissingSkills(userId, limit);

    console.log(`✅ Missing Skills generated - ${missingSkillsData.labels.length} skills`);

    return responseUtils.sendSuccess(
      res,
      missingSkillsData,
      'Missing skills data retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get missing skills error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve missing skills'
    );
  }
};

/**
 * @desc    Get ATS Score Distribution
 * @route   GET /api/dashboard/charts/ats-distribution
 * @access  Private - Requires authentication
 * @returns ATS score distribution by ranges
 */
export const getATSScoreDistribution = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`📊 ATS Score Distribution request - User: ${userId}`);

    const distributionData = await analyticsService.getATSScoreDistribution(userId);

    console.log(`✅ ATS Distribution generated - ${distributionData.labels.length} ranges`);

    return responseUtils.sendSuccess(
      res,
      distributionData,
      'ATS score distribution retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get ATS distribution error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve ATS distribution'
    );
  }
};

/**
 * @desc    Get Analysis Success Rate
 * @route   GET /api/dashboard/charts/success-rate
 * @query   days - Number of days to look back (default: 30)
 * @access  Private - Requires authentication
 * @returns Analysis success rate over time
 */
export const getAnalysisSuccessRate = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = Math.min(Math.max(1, parseInt(req.query.days) || 30), 365);

    console.log(`📊 Analysis Success Rate request - User: ${userId}, Days: ${days}`);

    const successRateData = await analyticsService.getAnalysisSuccessRate(userId, days);

    console.log(`✅ Success Rate generated - ${successRateData.labels.length} data points`);

    return responseUtils.sendSuccess(
      res,
      successRateData,
      'Analysis success rate retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get success rate error:', error);
    return responseUtils.handleError(
      res,
      error,
      'Failed to retrieve success rate'
    );
  }
};
