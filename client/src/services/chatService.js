/**
 * Chat Service
 * Handles all API calls related to AI Resume Chat
 */

import apiClient from './api';

const chatService = {
  /**
   * Create a new chat session
   * @param {string} resumeId - Resume ID
   * @returns {Promise} API response
   */
  createSession: async (resumeId) => {
    const response = await apiClient.post('/api/chat/session', { resumeId });
    return response.data;
  },

  /**
   * Get all chat sessions for the authenticated user
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getSessions: async (params = {}) => {
    const response = await apiClient.get('/api/chat/sessions', { params });
    return response.data;
  },

  /**
   * Get a specific chat session with messages
   * @param {string} sessionId - Session ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getSession: async (sessionId, params = {}) => {
    const response = await apiClient.get(`/api/chat/session/${sessionId}`, { params });
    return response.data;
  },

  /**
   * Send a message and get AI response
   * @param {string} sessionId - Session ID
   * @param {string} message - User message
   * @returns {Promise} API response
   */
  sendMessage: async (sessionId, message) => {
    const response = await apiClient.post(`/api/chat/${sessionId}`, { message });
    return response.data;
  },

  /**
   * Delete a chat session
   * @param {string} sessionId - Session ID
   * @param {boolean} hard - Permanent delete
   * @returns {Promise} API response
   */
  deleteSession: async (sessionId, hard = false) => {
    const response = await apiClient.delete(`/api/chat/session/${sessionId}`, {
      params: { hard },
    });
    return response.data;
  },

  /**
   * Update chat session title
   * @param {string} sessionId - Session ID
   * @param {string} title - New title
   * @returns {Promise} API response
   */
  updateSessionTitle: async (sessionId, title) => {
    const response = await apiClient.patch(`/api/chat/session/${sessionId}/title`, { title });
    return response.data;
  },

  /**
   * Archive a chat session
   * @param {string} sessionId - Session ID
   * @returns {Promise} API response
   */
  archiveSession: async (sessionId) => {
    const response = await apiClient.patch(`/api/chat/session/${sessionId}/archive`);
    return response.data;
  },

  /**
   * Search messages in a session
   * @param {string} sessionId - Session ID
   * @param {string} query - Search query
   * @returns {Promise} API response
   */
  searchMessages: async (sessionId, query) => {
    const response = await apiClient.get(`/api/chat/session/${sessionId}/search`, {
      params: { q: query },
    });
    return response.data;
  },

  /**
   * Get chat session statistics
   * @param {string} sessionId - Session ID
   * @returns {Promise} API response
   */
  getStatistics: async (sessionId) => {
    const response = await apiClient.get(`/api/chat/${sessionId}/stats`);
    return response.data;
  },
};

export default chatService;
