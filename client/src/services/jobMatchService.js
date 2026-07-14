/**
 * Job Match Service
 * API calls for resume-to-job comparison
 */

import api from './api';

/**
 * Generate or retrieve job match
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @param {boolean} force - Force regeneration
 * @returns {Promise} API response
 */
export const generateJobMatch = async (resumeId, jobDescriptionId, force = false) => {
  const url = `/job-match/${resumeId}/${jobDescriptionId}${force ? '?force=true' : ''}`;
  return api.post(url);
};

/**
 * Get existing job match
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @returns {Promise} API response
 */
export const getJobMatch = async (resumeId, jobDescriptionId) => {
  return api.get(`/job-match/${resumeId}/${jobDescriptionId}`);
};

/**
 * Get job match status
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @returns {Promise} API response
 */
export const getJobMatchStatus = async (resumeId, jobDescriptionId) => {
  return api.get(`/job-match/${resumeId}/${jobDescriptionId}/status`);
};

/**
 * Delete job match
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @returns {Promise} API response
 */
export const deleteJobMatch = async (resumeId, jobDescriptionId) => {
  return api.delete(`/job-match/${resumeId}/${jobDescriptionId}`);
};

/**
 * Get job match history for authenticated user
 * @param {object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.status - Filter by status (pending, processing, completed, failed)
 * @param {string} params.sortBy - Sort field
 * @param {string} params.order - Sort order (asc, desc)
 * @returns {Promise} API response
 */
export const getJobMatchHistory = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/job-match/history${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get specific job match from history by ID
 * @param {string} matchId - Job match ID
 * @returns {Promise} API response
 */
export const getJobMatchById = async (matchId) => {
  return api.get(`/job-match/history/${matchId}`);
};

/**
 * Poll job match status until completed or failed
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @param {function} onUpdate - Callback for status updates
 * @param {number} interval - Polling interval in ms (default: 2000)
 * @param {number} maxAttempts - Maximum polling attempts (default: 60, ~2 minutes)
 * @returns {Promise} Final status
 */
export const pollJobMatchStatus = async (
  resumeId,
  jobDescriptionId,
  onUpdate = null,
  interval = 2000,
  maxAttempts = 60
) => {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        attempts++;
        
        if (attempts > maxAttempts) {
          reject(new Error('Polling timeout: Job match is taking longer than expected'));
          return;
        }
        
        const response = await getJobMatchStatus(resumeId, jobDescriptionId);
        const { status } = response.data;

        if (onUpdate) {
          onUpdate(response.data, attempts);
        }

        if (status === 'completed') {
          resolve(response.data);
        } else if (status === 'failed') {
          reject(new Error(response.data.errorMessage || 'Job match generation failed'));
        } else {
          // Still processing or pending, continue polling
          setTimeout(poll, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};
