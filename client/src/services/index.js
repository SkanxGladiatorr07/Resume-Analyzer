/**
 * Service Index
 * Central export point for all API services
 */

import apiClient from './api';
import healthService from './healthService';

// Export individual services
export { apiClient, healthService };

// Future services can be added here:
// export { default as authService } from './authService';
// export { default as resumeService } from './resumeService';
// export { default as userService } from './userService';
