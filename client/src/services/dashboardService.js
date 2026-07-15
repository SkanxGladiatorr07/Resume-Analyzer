/**
 * Dashboard Service
 * API calls for dashboard analytics and statistics
 */

import api from './api';
import { handleApiError, retryRequest } from '../utils/errorHandler';

/**
 * Get complete dashboard data
 * @returns {Promise} API response
 */
export const getDashboard = async () => {
  try {
    return await retryRequest(() => api.get('/dashboard'));
  } catch (error) {
    const message = handleApiError(error, 'getDashboard');
    throw new Error(message);
  }
};

/**
 * Get dashboard overview only
 * @returns {Promise} API response
 */
export const getDashboardOverview = async () => {
  try {
    return await retryRequest(() => api.get('/dashboard/overview'));
  } catch (error) {
    const message = handleApiError(error, 'getDashboardOverview');
    throw new Error(message);
  }
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
  try {
    const queryString = new URLSearchParams(params).toString();
    return await retryRequest(() =>
      api.get(`/dashboard/charts${queryString ? `?${queryString}` : ''}`)
    );
  } catch (error) {
    const message = handleApiError(error, 'getChartData');
    throw new Error(message);
  }
};

/**
 * Get recent activity
 * @param {number} limit - Number of activities
 * @returns {Promise} API response
 */
export const getRecentActivity = async (limit = 10) => {
  try {
    return await retryRequest(() => api.get(`/dashboard/activity?limit=${limit}`));
  } catch (error) {
    const message = handleApiError(error, 'getRecentActivity');
    throw new Error(message);
  }
};

/**
 * Get status breakdown
 * @returns {Promise} API response
 */
export const getStatusBreakdown = async () => {
  try {
    return await retryRequest(() => api.get('/dashboard/status'));
  } catch (error) {
    const message = handleApiError(error, 'getStatusBreakdown');
    throw new Error(message);
  }
};
