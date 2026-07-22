import apiClient from './api';

/**
 * Authentication Service
 * Handles user registration, login, and profile operations
 */

const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Response with user and token
   */
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - Email and password
   * @returns {Promise} Response with user and token
   */
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise} Response with user data
   */
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  /**
   * Store token in localStorage
   * @param {String} token - JWT token
   */
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  /**
   * Get token from localStorage
   * @returns {String|null} JWT token
   */
  getToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Remove token from localStorage
   */
  removeToken: () => {
    localStorage.removeItem('token');
  },

  /**
   * Check if user is authenticated
   * @returns {Boolean}
   */
  isAuthenticated: () => {
    return !!authService.getToken();
  },
};

export default authService;
