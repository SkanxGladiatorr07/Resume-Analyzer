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
      const response = await apiClient.post('/api/ai/rewrite', data);
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
      const response = await apiClient.post('/api/ai/star', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Generate interview questions
   * @param {Object} data - { resumeId, jobTitle, experienceLevel }
   * @returns {Promise}
   */
  generateInterviewQuestions: async (data) => {
    try {
      const response = await apiClient.post('/api/ai/interview-questions', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get project suggestions
   * @param {Object} data - { skills, experience, careerGoal }
   * @returns {Promise}
   */
  getProjectSuggestions: async (data) => {
    try {
      const response = await apiClient.post('/api/ai/project-suggestions', data);
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
      const response = await apiClient.post('/api/ai/learning-roadmap', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Generate career roadmap
   * @param {Object} data - { currentRole, targetRole, yearsOfExperience }
   * @returns {Promise}
   */
  generateCareerRoadmap: async (data) => {
    try {
      const response = await apiClient.post('/api/ai/career-roadmap', data);
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
      const response = await apiClient.get('/api/ai/rewrite/config');
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
      const response = await apiClient.get('/api/ai/star/config');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default careerService;
