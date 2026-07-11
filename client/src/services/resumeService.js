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
