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
 * Poll job match status until completed or failed
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @param {function} onUpdate - Callback for status updates
 * @param {number} interval - Polling interval in ms (default: 2000)
 * @returns {Promise} Final status
 */
export const pollJobMatchStatus = async (
  resumeId,
  jobDescriptionId,
  onUpdate = null,
  interval = 2000
) => {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await getJobMatchStatus(resumeId, jobDescriptionId);
        const { status } = response.data;

        if (onUpdate) {
          onUpdate(response.data);
        }

        if (status === 'completed') {
          resolve(response.data);
        } else if (status === 'failed') {
          reject(new Error(response.data.errorMessage || 'Job match generation failed'));
        } else {
          // Still processing, continue polling
          setTimeout(poll, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};
