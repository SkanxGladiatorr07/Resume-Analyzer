/**
 * Service Index
 * Central export point for all API services
 */

import apiClient from './api';
import healthService from './healthService';
import authService from './authService';
import * as resumeService from './resumeService';
import analysisService from './analysisService';
import * as jobDescriptionService from './jobDescriptionService';
import * as jobMatchService from './jobMatchService';
import * as dashboardService from './dashboardService';

// Export individual services
export { 
  apiClient, 
  healthService, 
  authService, 
  resumeService, 
  analysisService,
  jobDescriptionService,
  jobMatchService,
  dashboardService
};
