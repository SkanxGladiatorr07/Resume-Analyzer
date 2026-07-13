/**
 * Job Description Service
 * API calls for job description management
 */

import api from './api';

/**
 * Create a new job description
 * @param {Object} data - Job description data
 * @returns {Promise} API response
 */
export const createJobDescription = async (data) => {
  return api.post('/job-descriptions', data);
};

/**
 * Get all job descriptions
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} API response
 */
export const getJobDescriptions = async (page = 1, limit = 100) => {
  return api.get(`/job-descriptions?page=${page}&limit=${limit}`);
};

/**
 * Get a single job description by ID
 * @param {string} id - Job description ID
 * @returns {Promise} API response
 */
export const getJobDescriptionById = async (id) => {
  return api.get(`/job-descriptions/${id}`);
};

/**
 * Update a job description
 * @param {string} id - Job description ID
 * @param {Object} data - Updated data
 * @returns {Promise} API response
 */
export const updateJobDescription = async (id, data) => {
  return api.put(`/job-descriptions/${id}`, data);
};

/**
 * Delete a job description
 * @param {string} id - Job description ID
 * @returns {Promise} API response
 */
export const deleteJobDescription = async (id) => {
  return api.delete(`/job-descriptions/${id}`);
};
