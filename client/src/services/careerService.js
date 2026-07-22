/**
 * Career Service
 * API calls for Career Assistant tools
 */

import apiClient from './api';

const careerService = {
  /**
   * Rewrite resume content
   * @param {Object} data - { resumeId, section, content, tone }
   * @returns {Promise}
   */
  rewriteContent: async (data) => {
    try {
      const response = await apiClient.post('/ai/rewrite', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Generate STAR bullet point
   * @param {Object} data - { resumeId, experience }
   * @returns {Promise}
   */
  generateStar: async (data) => {
    try {
      const response = await apiClient.post('/ai/star', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Generate interview questions
   * @param {Object} data - { resumeId, jobDescription }
   * @returns {Promise}
   */
  generateInterviewQuestions: async (data) => {
    try {
      const response = await apiClient.post('/ai/interview', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get project suggestions
   * @param {Object} data - { existingSkills, missingSkills, careerGoal }
   * @returns {Promise}
   */
  getProjectSuggestions: async (data) => {
    try {
      const response = await apiClient.post('/ai/projects', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Generate learning roadmap
   * @param {Object} data - { currentSkills, targetRole, timeframe }
   * @returns {Promise}
   */
  generateLearningRoadmap: async (data) => {
    try {
      const response = await apiClient.post('/ai/roadmap/learning', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Generate career roadmap
   * @param {Object} data - { currentRole, targetCareerRole, yearsOfExperience }
   * @returns {Promise}
   */
  generateCareerRoadmap: async (data) => {
    try {
      const response = await apiClient.post('/ai/roadmap/career', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get rewrite configuration
   * @returns {Promise}
   */
  getRewriteConfig: async () => {
    try {
      const response = await apiClient.get('/ai/rewrite/config');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get STAR configuration
   * @returns {Promise}
   */
  getStarConfig: async () => {
    try {
      const response = await apiClient.get('/ai/star/config');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default careerService;
