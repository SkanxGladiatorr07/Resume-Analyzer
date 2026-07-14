/**
 * Dashboard Service
 * API calls for dashboard analytics and statistics
 */

import api from './api';

/**
 * Get complete dashboard data
 * @returns {Promise} API response
 */
export const getDashboard = async () => {
  return api.get('/dashboard');
};

/**
 * Get dashboard overview only
 * @returns {Promise} API response
 */
export const getDashboardOverview = async () => {
  return api.get('/dashboard/overview');
};

/**
 * Get all chart data
 * @param {Object} params - Query parameters
 * @param {number} params.days - Number of days for time-based charts
 * @param {number} params.topSkills - Number of top skills
 * @param {number} params.topMissingSkills - Number of top missing skills
 * @returns {Promise} API response
 */
export const getChartData = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/dashboard/charts${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get recent activity
 * @param {number} limit - Number of activities
 * @returns {Promise} API response
 */
export const getRecentActivity = async (limit = 10) => {
  return api.get(`/dashboard/activity?limit=${limit}`);
};

/**
 * Get status breakdown
 * @returns {Promise} API response
 */
export const getStatusBreakdown = async () => {
  return api.get('/dashboard/status');
};
