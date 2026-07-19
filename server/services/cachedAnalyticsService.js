/**
 * Cached Analytics Service
 * Wraps analyticsService with intelligent caching to reduce database load
 * 
 * @module services/cachedAnalyticsService
 */

import * as analyticsService from './analyticsService.js';
import * as cacheManager from '../utils/cacheManager.js';

/**
 * Get ATS Score Trend with caching
 * Cache expires after 5 minutes
 * 
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} Trend data
 */
export const getATSScoreTrend = async (userId, days = 30) => {
  const cacheParams = { userId, days, method: 'getATSScoreTrend' };
  
  // Try cache first
  const cached = cacheManager.get('ANALYTICS_CHARTS', cacheParams);
  if (cached) {
    return { ...cached, fromCache: true };
  }
  
  // Fetch from database
  const result = await analyticsService.getATSScoreTrend(userId, days);
  
  // Cache result
  cacheManager.set('ANALYTICS_CHARTS', cacheParams, result);
  
  return { ...result, fromCache: false };
};

/**
 * Get Resume Upload Timeline with caching
 * 
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} Upload timeline data
 */
export const getResumeUploadTimeline = async (userId, days = 30) => {
  const cacheParams = { userId, days, method: 'getResumeUploadTimeline' };
  
  const cached = cacheManager.get('ANALYTICS_CHARTS', cacheParams);
  if (cached) {
    return { ...cached, fromCache: true };
  }
  
  const result = await analyticsService.getResumeUploadTimeline(userId, days);
  cacheManager.set('ANALYTICS_CHARTS', cacheParams, result);
  
  return { ...result, fromCache: false };
};

/**
 * Get Skill Distribution with caching
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Skill distribution data
 */
export const getSkillDistribution = async (userId) => {
  const cacheParams = { userId, method: 'getSkillDistribution' };
  
  const cached = cacheManager.get('ANALYTICS_CHARTS', cacheParams);
  if (cached) {
    return { ...cached, fromCache: true };
  }
  
  const result = await analyticsService.getSkillDistribution(userId);
  cacheManager.set('ANALYTICS_CHARTS', cacheParams, result);
  
  return { ...result, fromCache: false };
};

/**
 * Get Job Match Success Rate with caching
 * 
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} Match success data
 */
export const getJobMatchSuccessRate = async (userId, days = 30) => {
  const cacheParams = { userId, days, method: 'getJobMatchSuccessRate' };
  
  const cached = cacheManager.get('ANALYTICS_CHARTS', cacheParams);
  if (cached) {
    return { ...cached, fromCache: true };
  }
  
  const result = await analyticsService.getJobMatchSuccessRate(userId, days);
  cacheManager.set('ANALYTICS_CHARTS', cacheParams, result);
  
  return { ...result, fromCache: false };
};

/**
 * Get Analysis Completion Time with caching
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Completion time data
 */
export const getAnalysisCompletionTime = async (userId) => {
  const cacheParams = { userId, method: 'getAnalysisCompletionTime' };
  
  const cached = cacheManager.get('ANALYTICS_CHARTS', cacheParams);
  if (cached) {
    return { ...cached, fromCache: true };
  }
  
  const result = await analyticsService.getAnalysisCompletionTime(userId);
  cacheManager.set('ANALYTICS_CHARTS', cacheParams, result);
  
  return { ...result, fromCache: false };
};

/**
 * Get Dashboard Summary Stats with caching
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Dashboard stats
 */
export const getDashboardSummary = async (userId) => {
  const cacheParams = { userId, method: 'getDashboardSummary' };
  
  const cached = cacheManager.get('ANALYTICS_DASHBOARD', cacheParams);
  if (cached) {
    return { ...cached, fromCache: true };
  }
  
  const result = await analyticsService.getDashboardSummary(userId);
  cacheManager.set('ANALYTICS_DASHBOARD', cacheParams, result);
  
  return { ...result, fromCache: false };
};

/**
 * Get Top Keywords with caching
 * 
 * @param {string} userId - User ID
 * @param {number} limit - Number of keywords to return
 * @returns {Promise<Object>} Top keywords data
 */
export const getTopKeywords = async (userId, limit = 10) => {
  const cacheParams = { userId, limit, method: 'getTopKeywords' };
  
  const cached = cacheManager.get('ANALYTICS_STATS', cacheParams);
  if (cached) {
    return { ...cached, fromCache: true };
  }
  
  const result = await analyticsService.getTopKeywords(userId, limit);
  cacheManager.set('ANALYTICS_STATS', cacheParams, result);
  
  return { ...result, fromCache: false };
};

/**
 * Get Recent Activity with caching
 * 
 * @param {string} userId - User ID
 * @param {number} limit - Number of activities to return
 * @returns {Promise<Array>} Recent activities
 */
export const getRecentActivity = async (userId, limit = 10) => {
  const cacheParams = { userId, limit, method: 'getRecentActivity' };
  
  const cached = cacheManager.get('ANALYTICS_STATS', cacheParams);
  if (cached) {
    return { data: cached, fromCache: true };
  }
  
  const result = await analyticsService.getRecentActivity(userId, limit);
  cacheManager.set('ANALYTICS_STATS', cacheParams, result);
  
  return { data: result, fromCache: false };
};

/**
 * Invalidate analytics cache for a user
 * Call this when user performs actions that affect analytics
 * 
 * @param {string} userId - User ID
 * @returns {number} Number of cache entries invalidated
 */
export const invalidateUserCache = (userId) => {
  return cacheManager.invalidatePattern(`userId:${userId}`);
};

/**
 * Invalidate all analytics caches
 * Use sparingly - only when major data changes occur
 * 
 * @returns {Object} Number of entries invalidated per type
 */
export const invalidateAllAnalytics = () => {
  return {
    dashboard: cacheManager.invalidateType('ANALYTICS_DASHBOARD'),
    charts: cacheManager.invalidateType('ANALYTICS_CHARTS'),
    stats: cacheManager.invalidateType('ANALYTICS_STATS'),
  };
};

// Export all original functions that don't need caching
export * from './analyticsService.js';

export default {
  getATSScoreTrend,
  getResumeUploadTimeline,
  getSkillDistribution,
  getJobMatchSuccessRate,
  getAnalysisCompletionTime,
  getDashboardSummary,
  getTopKeywords,
  getRecentActivity,
  invalidateUserCache,
  invalidateAllAnalytics,
};
