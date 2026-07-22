import apiClient from './api';

/**
 * Health Service
 * Handles health check and server status endpoints
 */

const healthService = {
  /**
   * Check backend health status
   * @returns {Promise} Response with health status
   */
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default healthService;
