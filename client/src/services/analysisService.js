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
};

export default analysisService;
