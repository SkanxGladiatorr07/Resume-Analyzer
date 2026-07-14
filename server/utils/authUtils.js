/**
 * Authentication & Authorization Utilities
 * Reusable functions for ownership verification and access control
 */

import Resume from '../models/Resume.js';
import JobDescription from '../models/JobDescription.js';
import JobMatch from '../models/JobMatch.js';
import Analysis from '../models/Analysis.js';

/**
 * Verify user owns a resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Resume document if authorized
 * @throws {Error} If not authorized or not found
 */
export const verifyResumeOwnership = async (resumeId, userId) => {
  const resume = await Resume.findById(resumeId);
  
  if (!resume) {
    const error = new Error('Resume not found');
    error.statusCode = 404;
    throw error;
  }

  if (resume.user.toString() !== userId.toString()) {
    const error = new Error('Not authorized to access this resume');
    error.statusCode = 403;
    throw error;
  }

  return resume;
};

/**
 * Verify user owns a job description
 * @param {string} jobDescriptionId - Job Description ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} JobDescription document if authorized
 * @throws {Error} If not authorized or not found
 */
export const verifyJobDescriptionOwnership = async (jobDescriptionId, userId) => {
  const jobDescription = await JobDescription.findById(jobDescriptionId);
  
  if (!jobDescription) {
    const error = new Error('Job description not found');
    error.statusCode = 404;
    throw error;
  }

  if (jobDescription.user.toString() !== userId.toString()) {
    const error = new Error('Not authorized to access this job description');
    error.statusCode = 403;
    throw error;
  }

  return jobDescription;
};

/**
 * Verify user owns a job match
 * @param {string} matchId - Job Match ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} JobMatch document if authorized
 * @throws {Error} If not authorized or not found
 */
export const verifyJobMatchOwnership = async (matchId, userId) => {
  const jobMatch = await JobMatch.findById(matchId);
  
  if (!jobMatch) {
    const error = new Error('Job match not found');
    error.statusCode = 404;
    throw error;
  }

  if (jobMatch.user.toString() !== userId.toString()) {
    const error = new Error('Not authorized to access this job match');
    error.statusCode = 403;
    throw error;
  }

  return jobMatch;
};

/**
 * Verify user owns an analysis
 * @param {string} analysisId - Analysis ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Analysis document if authorized
 * @throws {Error} If not authorized or not found
 */
export const verifyAnalysisOwnership = async (analysisId, userId) => {
  const analysis = await Analysis.findById(analysisId);
  
  if (!analysis) {
    const error = new Error('Analysis not found');
    error.statusCode = 404;
    throw error;
  }

  if (analysis.user.toString() !== userId.toString()) {
    const error = new Error('Not authorized to access this analysis');
    error.statusCode = 403;
    throw error;
  }

  return analysis;
};

/**
 * Verify resume, job description, and match ownership (triple verification)
 * Used for job match operations to ensure complete authorization
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Object with resume and jobDescription documents
 * @throws {Error} If any resource is not authorized or not found
 */
export const verifyJobMatchResources = async (resumeId, jobDescriptionId, userId) => {
  // Verify resume ownership
  const resume = await verifyResumeOwnership(resumeId, userId);
  
  // Verify resume is parsed
  if (resume.parsingStatus !== 'completed') {
    const error = new Error('Resume must be successfully parsed before job matching');
    error.statusCode = 400;
    throw error;
  }

  if (!resume.structuredData) {
    const error = new Error('No structured data available for job matching');
    error.statusCode = 400;
    throw error;
  }

  // Verify job description ownership
  const jobDescription = await verifyJobDescriptionOwnership(jobDescriptionId, userId);

  return { resume, jobDescription };
};

/**
 * Verify user owns a resource by type
 * Generic verification function
 * @param {string} resourceType - Type of resource (resume, jobDescription, jobMatch, analysis)
 * @param {string} resourceId - Resource ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Resource document if authorized
 * @throws {Error} If not authorized or not found
 */
export const verifyOwnership = async (resourceType, resourceId, userId) => {
  const verifiers = {
    resume: verifyResumeOwnership,
    jobDescription: verifyJobDescriptionOwnership,
    jobMatch: verifyJobMatchOwnership,
    analysis: verifyAnalysisOwnership,
  };

  const verifier = verifiers[resourceType];
  
  if (!verifier) {
    const error = new Error(`Unknown resource type: ${resourceType}`);
    error.statusCode = 400;
    throw error;
  }

  return await verifier(resourceId, userId);
};

/**
 * Check if user owns multiple resources
 * @param {Array} checks - Array of {type, id} objects
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Map of resource type to document
 * @throws {Error} If any resource is not authorized
 */
export const verifyMultipleOwnership = async (checks, userId) => {
  const results = {};
  
  for (const check of checks) {
    results[check.type] = await verifyOwnership(check.type, check.id, userId);
  }
  
  return results;
};

/**
 * Lightweight ownership check (only checks user field)
 * Faster than full verification, use for status checks
 * @param {string} Model - Mongoose model
 * @param {string} resourceId - Resource ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if owned by user
 */
export const quickOwnershipCheck = async (Model, resourceId, userId) => {
  const resource = await Model.findById(resourceId).select('user');
  return resource && resource.user.toString() === userId.toString();
};
