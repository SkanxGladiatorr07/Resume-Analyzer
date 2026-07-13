/**
 * Analysis Service
 * Handles all analysis-related API calls
 */

import apiClient from './api';

const analysisService = {
  /**
   * Generate or retrieve analysis for a resume
   * @param {string} resumeId - Resume ID
   * @param {boolean} force - Force regeneration
   * @returns {Promise} Analysis data
   */
  generateAnalysis: async (resumeId, force = false) => {
    try {
      const url = force 
        ? `/api/analysis/${resumeId}?force=true`
        : `/api/analysis/${resumeId}`;
      
      const response = await apiClient.post(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get existing analysis for a resume
   * @param {string} resumeId - Resume ID
   * @returns {Promise} Analysis data
   */
  getAnalysis: async (resumeId) => {
    try {
      const response = await apiClient.get(`/api/analysis/${resumeId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get analysis status
   * @param {string} resumeId - Resume ID
   * @returns {Promise} Status data
   */
  getAnalysisStatus: async (resumeId) => {
    try {
      const response = await apiClient.get(`/api/analysis/${resumeId}/status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retry failed analysis
   * @param {string} resumeId - Resume ID
   * @returns {Promise} Analysis data
   */
  retryAnalysis: async (resumeId) => {
    try {
      const response = await apiClient.post(`/api/analysis/${resumeId}/retry`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete analysis for a resume
   * @param {string} resumeId - Resume ID
   * @returns {Promise} Success message
   */
  deleteAnalysis: async (resumeId) => {
    try {
      const response = await apiClient.delete(`/api/analysis/${resumeId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if analysis exists for a resume
   * @param {string} resumeId - Resume ID
   * @returns {Promise} Existence status
   */
  checkAnalysisExists: async (resumeId) => {
    try {
      const response = await apiClient.get(`/api/analysis/${resumeId}/exists`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Poll analysis status until complete or failed
   * @param {string} resumeId - Resume ID
   * @param {function} onStatusChange - Callback for status updates
   * @param {number} maxAttempts - Maximum polling attempts
   * @returns {Promise} Final analysis data
   */
  pollAnalysisStatus: async (resumeId, onStatusChange, maxAttempts = 60) => {
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await analysisService.getAnalysis(resumeId);
        
        if (onStatusChange) {
          onStatusChange(response);
        }

        const status = response.status || response.data?.analysisStatus;

        if (status === 'completed') {
          return response;
        }

        if (status === 'failed') {
          throw new Error(response.data?.errorMessage || 'Analysis generation failed');
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Analysis polling timeout');
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        return poll();
      } catch (error) {
        if (error.response?.status === 404) {
          // Analysis doesn't exist yet, wait and retry
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('Analysis not found after maximum attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
          return poll();
        }
        throw error;
      }
    };

    return poll();
  },
};

export default analysisService;
