/**
 * Resume Service
 * Handles all resume-related API calls
 */

import apiClient from './api';

/**
 * Upload a resume file
 * @param {File} file - The resume file to upload
 * @returns {Promise} API response
 */
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await apiClient.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Get all resumes for the authenticated user
 * @returns {Promise} API response with resumes array
 */
export const getResumes = async () => {
  const response = await apiClient.get('/resumes');
  return response.data;
};

/**
 * Delete a resume by ID
 * @param {string} resumeId - The ID of the resume to delete
 * @returns {Promise} API response
 */
export const deleteResume = async (resumeId) => {
  const response = await apiClient.delete(`/resumes/${resumeId}`);
  return response.data;
};

/**
 * Get raw extracted text from a resume
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise} API response with extracted text
 */
export const getResumeRawText = async (resumeId) => {
  const response = await apiClient.get(`/resumes/${resumeId}/raw-text`);
  return response.data;
};

/**
 * Get structured parsed data from a resume
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise} API response with structured data
 */
export const getResumeParsedData = async (resumeId) => {
  const response = await apiClient.get(`/resumes/${resumeId}/parsed`);
  return response.data;
};

/**
 * Get parsing status of a resume
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise} API response with parsing status
 */
export const getParsingStatus = async (resumeId) => {
  const response = await apiClient.get(`/resumes/${resumeId}/status`);
  return response.data;
};

/**
 * Format file size to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Toggle resume pin status
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise} API response
 */
export const togglePin = async (resumeId) => {
  const response = await apiClient.patch(`/resumes/${resumeId}/pin`);
  return response.data;
};

/**
 * Set resume as default
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise} API response
 */
export const setDefault = async (resumeId) => {
  const response = await apiClient.patch(`/resumes/${resumeId}/default`);
  return response.data;
};

/**
 * Remove default status from resume
 * @param {string} resumeId - The ID of the resume
 * @returns {Promise} API response
 */
export const removeDefault = async (resumeId) => {
  const response = await apiClient.delete(`/resumes/${resumeId}/default`);
  return response.data;
};

/**
 * Get resume versions
 * @param {string} resumeId - The ID of the resume
 * @param {Object} params - Query parameters (limit, skip, includeData)
 * @returns {Promise} API response with versions array
 */
export const getResumeVersions = async (resumeId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiClient.get(`/resumes/${resumeId}/versions${queryString ? `?${queryString}` : ''}`);
  return response.data;
};

/**
 * Compare two resume versions
 * @param {string} resumeId - The ID of the resume
 * @param {number} version1 - First version number
 * @param {number} version2 - Second version number
 * @returns {Promise} API response with comparison data
 */
export const compareVersions = async (resumeId, version1, version2) => {
  const response = await apiClient.get(`/resumes/${resumeId}/compare/${version1}/${version2}`);
  return response.data;
};

/**
 * Get recent exports
 * @param {number} limit - Number of exports to retrieve
 * @returns {Promise} API response with exports array
 */
export const getRecentExports = async (limit = 5) => {
  const response = await apiClient.get(`/report/export/history?limit=${limit}`);
  return response.data;
};

/**
 * Get export statistics
 * @returns {Promise} API response with export stats
 */
export const getExportStats = async () => {
  const response = await apiClient.get('/report/export/stats');
  return response.data;
};
