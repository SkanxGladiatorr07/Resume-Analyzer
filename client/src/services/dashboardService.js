/**
 * Dashboard Service
 * API calls for dashboard analytics and statistics with caching support
 * 
 * @module dashboardService
 */

import api from './api';
import { handleApiError, retryRequest } from '../utils/errorHandler';
import { getOrSetCache, invalidateCachePattern, CacheTTL } from '../utils/cacheManager';

/**
 * Cache keys for dashboard data
 * @enum {string}
 */
const CACHE_KEYS = {
  DASHBOARD: 'dashboard:full',
  OVERVIEW: 'dashboard:overview',
  CHARTS: 'dashboard:charts',
  ACTIVITY: 'dashboard:activity',
  STATUS: 'dashboard:status',
};

/**
 * Dashboard overview response
 * @typedef {Object} DashboardOverview
 * @property {number} totalResumes - Total number of resumes
 * @property {number} totalAnalyses - Total number of analyses
 * @property {number} totalJobMatches - Total number of job matches
 * @property {number} avgAtsScore - Average ATS score
 * @property {number} highestAtsScore - Highest ATS score
 * @property {number} avgCompletenessScore - Average completeness score
 * @property {Object} latestResume - Latest resume object
 * @property {Object} latestAnalysis - Latest analysis object
 * @property {Object} latestJobMatch - Latest job match object
 */

/**
 * Chart data response
 * @typedef {Object} ChartData
 * @property {Object} atsScoreTrend - ATS score trend data
 * @property {Object} uploadTimeline - Upload timeline data
 * @property {Object} skillsDistribution - Skills distribution data
 * @property {Object} jobMatchScoreDistribution - Job match score distribution
 * @property {Object} atsScoreDistribution - ATS score distribution
 * @property {Object} missingSkills - Missing skills data
 */

/**
 * Get complete dashboard data
 * Uses caching with 5-minute TTL
 * 
 * @returns {Promise<Object>} Dashboard data with overview and charts
 * @throws {Error} If API request fails
 * 
 * @example
 * try {
 *   const dashboard = await getDashboard();
 *   console.log(dashboard.totalResumes);
 * } catch (error) {
 *   console.error(error.message);
 * }
 */
export const getDashboard = async () => {
  try {
    return await getOrSetCache(
      CACHE_KEYS.DASHBOARD,
      () => retryRequest(() => api.get('/dashboard')),
      CacheTTL.MEDIUM
    );
  } catch (error) {
    const message = handleApiError(error, 'getDashboard');
    throw new Error(message);
  }
};

/**
 * Get dashboard overview only (faster than full dashboard)
 * Uses caching with 5-minute TTL
 * 
 * @returns {Promise<DashboardOverview>} Dashboard overview data
 * @throws {Error} If API request fails
 * 
 * @example
 * const overview = await getDashboardOverview();
 * console.log(`Total Resumes: ${overview.totalResumes}`);
 */
export const getDashboardOverview = async () => {
  try {
    return await getOrSetCache(
      CACHE_KEYS.OVERVIEW,
      () => retryRequest(() => api.get('/dashboard/overview')),
      CacheTTL.MEDIUM
    );
  } catch (error) {
    const message = handleApiError(error, 'getDashboardOverview');
    throw new Error(message);
  }
};

/**
 * Get all chart data
 * Uses caching with 15-minute TTL (charts change less frequently)
 * 
 * @param {Object} [params={}] - Query parameters
 * @param {number} [params.days=30] - Number of days for time-based charts
 * @param {number} [params.topSkills=10] - Number of top skills to return
 * @param {number} [params.topMissingSkills=5] - Number of top missing skills
 * @returns {Promise<ChartData>} Chart data for all visualizations
 * @throws {Error} If API request fails
 * 
 * @example
 * const charts = await getChartData({ days: 7, topSkills: 5 });
 * console.log(charts.atsScoreTrend);
 */
export const getChartData = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const cacheKey = `${CACHE_KEYS.CHARTS}:${queryString}`;

    return await getOrSetCache(
      cacheKey,
      () => retryRequest(() => api.get(`/dashboard/charts${queryString ? `?${queryString}` : ''}`)),
      CacheTTL.LONG // Charts update less frequently
    );
  } catch (error) {
    const message = handleApiError(error, 'getChartData');
    throw new Error(message);
  }
};

/**
 * Get recent activity
 * Uses caching with 1-minute TTL (activity updates frequently)
 * 
 * @param {number} [limit=10] - Number of activities to return
 * @returns {Promise<Array>} Array of recent activity objects
 * @throws {Error} If API request fails
 * 
 * @example
 * const activities = await getRecentActivity(5);
 * activities.forEach(activity => console.log(activity.type));
 */
export const getRecentActivity = async (limit = 10) => {
  try {
    const cacheKey = `${CACHE_KEYS.ACTIVITY}:${limit}`;

    return await getOrSetCache(
      cacheKey,
      () => retryRequest(() => api.get(`/dashboard/activity?limit=${limit}`)),
      CacheTTL.SHORT // Activity should be fresh
    );
  } catch (error) {
    const message = handleApiError(error, 'getRecentActivity');
    throw new Error(message);
  }
};

/**
 * Get status breakdown
 * Uses caching with 5-minute TTL
 * 
 * @returns {Promise<Object>} Status breakdown for resumes, analyses, and matches
 * @throws {Error} If API request fails
 * 
 * @example
 * const status = await getStatusBreakdown();
 * console.log(status.resumeStatus);
 */
export const getStatusBreakdown = async () => {
  try {
    return await getOrSetCache(
      CACHE_KEYS.STATUS,
      () => retryRequest(() => api.get('/dashboard/status')),
      CacheTTL.MEDIUM
    );
  } catch (error) {
    const message = handleApiError(error, 'getStatusBreakdown');
    throw new Error(message);
  }
};

/**
 * Invalidate all dashboard caches
 * Call this after user actions that affect dashboard data
 * (e.g., upload resume, delete resume, complete analysis)
 * 
 * @returns {number} Number of cache entries invalidated
 * 
 * @example
 * // After uploading a resume
 * await uploadResume(file);
 * invalidateDashboardCache(); // Refresh dashboard on next load
 */
export const invalidateDashboardCache = () => {
  return invalidateCachePattern('dashboard:*');
};

/**
 * Prefetch dashboard data
 * Useful for warming up cache before user navigates to dashboard
 * 
 * @returns {Promise<void>}
 * 
 * @example
 * // Prefetch dashboard data in the background
 * prefetchDashboardData();
 */
export const prefetchDashboardData = async () => {
  try {
    // Prefetch overview and charts in parallel
    await Promise.all([
      getDashboardOverview(),
      getChartData({ days: 30, topSkills: 10, topMissingSkills: 5 }),
    ]);
  } catch (error) {
    // Silent fail for prefetch
    console.warn('Dashboard prefetch failed:', error.message);
  }
};
