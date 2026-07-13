/**
 * Job Match Pipeline Service
 * Orchestrates resume-to-job comparison workflow
 * Handles generation, status tracking, and error recovery
 */

import JobMatch from '../models/JobMatch.js';
import Resume from '../models/Resume.js';
import JobDescription from '../models/JobDescription.js';
import * as geminiService from './geminiService.js';
import { generateJobMatchPrompt } from '../prompts/jobDescriptionMatch.js';
import * as aiValidator from '../utils/aiValidator.js';

/**
 * Create a pending job match entry
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} JobMatch document
 */
export const createPendingJobMatch = async (resumeId, jobDescriptionId, userId) => {
  try {
    // Check if match already exists
    const existing = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
    
    if (existing) {
      console.log(`⏭️  Job match already exists (status: ${existing.matchStatus})`);
      return existing;
    }

    // Create pending match
    const jobMatch = new JobMatch({
      resume: resumeId,
      jobDescription: jobDescriptionId,
      user: userId,
      matchStatus: 'pending',
    });

    await jobMatch.save();
    console.log(`📝 Created pending job match`);
    
    return jobMatch;
  } catch (error) {
    console.error('Error creating pending job match:', error);
    throw error;
  }
};

/**
 * Trigger job match generation (async, non-blocking)
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @param {string} userId - User ID
 */
export const triggerJobMatchGeneration = async (resumeId, jobDescriptionId, userId) => {
  // Run in background (don't await)
  generateJobMatchAsync(resumeId, jobDescriptionId, userId).catch(error => {
    console.error(`❌ Background job match generation failed:`, error);
  });
  
  console.log(`🚀 Job match generation triggered`);
};

/**
 * Generate job match asynchronously
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @param {string} userId - User ID
 */
const generateJobMatchAsync = async (resumeId, jobDescriptionId, userId) => {
  let jobMatch = null;
  
  try {
    console.log(`\n🔄 Starting background job match generation`);

    // Check if Gemini is available
    if (!geminiService.isGeminiAvailable()) {
      throw new Error('AI service is not available. Please configure Gemini API key.');
    }

    // Find or create job match
    jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
    
    if (!jobMatch) {
      jobMatch = await createPendingJobMatch(resumeId, jobDescriptionId, userId);
    }

    // Check if already processing
    if (jobMatch.matchStatus === 'processing') {
      console.log(`⏳ Job match already processing`);
      return;
    }

    // Update status to processing
    jobMatch.matchStatus = 'processing';
    jobMatch.matchStartedAt = new Date();
    jobMatch.retryCount = (jobMatch.retryCount || 0) + 1;
    await jobMatch.save();

    console.log(`⚙️  Job match status updated to 'processing'`);

    // Fetch resume
    const resume = await Resume.findById(resumeId);
    
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.parsingStatus !== 'completed') {
      throw new Error('Resume must be successfully parsed before job matching');
    }

    if (!resume.structuredData) {
      throw new Error('No structured data available for job matching');
    }

    // Fetch job description
    const jobDescription = await JobDescription.findById(jobDescriptionId);
    
    if (!jobDescription) {
      throw new Error('Job description not found');
    }

    // Generate prompt
    console.log(`📝 Generating job match prompt...`);
    const prompt = generateJobMatchPrompt(
      resume.structuredData, 
      jobDescription.description,
      jobDescription.title
    );

    // Check prompt size
    const sizeCheck = aiValidator.checkPromptSize(prompt);
    console.log(`📊 Prompt size: ~${sizeCheck.estimatedTokens} tokens (${sizeCheck.percentUsed.toFixed(1)}% of limit)`);

    // Call Gemini AI
    console.log(`🤖 Calling Gemini AI...`);
    const aiResponse = await geminiService.generateContent(prompt, true);

    // Validate response structure
    console.log(`✔️  Validating AI response structure...`);
    const validation = aiValidator.validateJobMatch(aiResponse);
    
    if (!validation.valid) {
      const errorMsg = `Invalid AI response structure: ${validation.errors.join(', ')}`;
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn(`⚠️  Validation warnings:`, validation.warnings);
    }

    // Perform content safety check
    console.log(`🛡️  Checking content safety...`);
    const safetyCheck = aiValidator.checkContentSafety(aiResponse);
    
    if (!safetyCheck.safe) {
      const safetyMsg = `Content safety issues detected: ${safetyCheck.issues.join(', ')}`;
      console.error(`❌ ${safetyMsg}`);
      throw new Error(safetyMsg);
    }

    // Sanitize data
    console.log(`🧹 Sanitizing job match data...`);
    const sanitizedData = aiValidator.sanitizeJobMatch(aiResponse);

    // Calculate confidence score
    const confidenceScore = aiValidator.calculateJobMatchConfidence(sanitizedData);
    console.log(`📊 Job match confidence score: ${confidenceScore}%`);

    // Update job match with results
    jobMatch.matchStatus = 'completed';
    jobMatch.matchScore = sanitizedData.matchScore;
    jobMatch.summary = sanitizedData.summary;
    jobMatch.matchingSkills = sanitizedData.matchingSkills;
    jobMatch.missingTechnicalSkills = sanitizedData.missingTechnicalSkills;
    jobMatch.missingSoftSkills = sanitizedData.missingSoftSkills;
    jobMatch.missingKeywords = sanitizedData.missingKeywords;
    jobMatch.strengths = sanitizedData.strengths;
    jobMatch.recommendations = sanitizedData.recommendations;
    jobMatch.atsOptimizationTips = sanitizedData.atsOptimizationTips;
    jobMatch.confidenceScore = confidenceScore;
    jobMatch.generatedAt = new Date();
    jobMatch.matchCompletedAt = new Date();
    jobMatch.errorMessage = null;
    jobMatch.errorDetails = null;

    await jobMatch.save();

    // Record usage in job description
    await jobDescription.recordUsage();

    const duration = jobMatch.matchCompletedAt - jobMatch.matchStartedAt;
    console.log(`✅ Job match completed successfully`);
    console.log(`   Match Score: ${jobMatch.matchScore}%`);
    console.log(`   Confidence: ${confidenceScore}%`);
    console.log(`   Duration: ${duration}ms\n`);

  } catch (error) {
    console.error(`❌ Job match generation failed:`, error);

    // Update job match with error
    if (jobMatch) {
      jobMatch.matchStatus = 'failed';
      jobMatch.errorMessage = error.message;
      jobMatch.errorDetails = error.stack;
      jobMatch.matchCompletedAt = new Date();
      
      try {
        await jobMatch.save();
        console.log(`💾 Error saved to job match document`);
      } catch (saveError) {
        console.error(`Failed to save error to job match:`, saveError);
      }
    }

    // Log detailed error for debugging
    console.error('🤖 Job Match Error Details:', {
      resumeId: jobMatch?.resume,
      jobDescriptionId: jobMatch?.jobDescription,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Regenerate job match (force new generation)
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated job match
 */
export const regenerateJobMatch = async (resumeId, jobDescriptionId, userId) => {
  try {
    console.log(`🔄 Regenerating job match`);

    // Find existing match
    const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
    
    if (!jobMatch) {
      // No existing match, create and generate
      await createPendingJobMatch(resumeId, jobDescriptionId, userId);
      await triggerJobMatchGeneration(resumeId, jobDescriptionId, userId);
      return await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
    }

    // Check if can regenerate
    if (jobMatch.isInProgress()) {
      throw new Error('Job match is currently processing. Please wait for it to complete.');
    }

    // Reset match to processing state
    jobMatch.matchStatus = 'processing';
    jobMatch.matchStartedAt = new Date();
    jobMatch.forcedRegeneration = true;
    jobMatch.retryCount = 0;
    jobMatch.errorMessage = null;
    jobMatch.errorDetails = null;
    
    await jobMatch.save();

    // Trigger async generation
    generateJobMatchAsync(resumeId, jobDescriptionId, userId).catch(error => {
      console.error(`Regeneration failed:`, error);
    });

    return jobMatch;
  } catch (error) {
    console.error('Error regenerating job match:', error);
    throw error;
  }
};

/**
 * Get job match status
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @returns {Promise<Object>} Job match status
 */
export const getJobMatchStatus = async (resumeId, jobDescriptionId) => {
  try {
    const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
    
    if (!jobMatch) {
      return {
        exists: false,
        status: null,
      };
    }

    return {
      exists: true,
      status: jobMatch.matchStatus,
      matchScore: jobMatch.matchScore,
      errorMessage: jobMatch.errorMessage,
      matchStartedAt: jobMatch.matchStartedAt,
      matchCompletedAt: jobMatch.matchCompletedAt,
      retryCount: jobMatch.retryCount,
    };
  } catch (error) {
    console.error('Error getting job match status:', error);
    throw error;
  }
};

/**
 * Retry failed job match
 * @param {string} resumeId - Resume ID
 * @param {string} jobDescriptionId - Job Description ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Job match document
 */
export const retryFailedJobMatch = async (resumeId, jobDescriptionId, userId) => {
  try {
    const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
    
    if (!jobMatch) {
      throw new Error('Job match not found');
    }

    if (jobMatch.matchStatus !== 'failed') {
      throw new Error('Can only retry failed job matches');
    }

    // Reset to processing
    jobMatch.matchStatus = 'processing';
    jobMatch.matchStartedAt = new Date();
    jobMatch.errorMessage = null;
    jobMatch.errorDetails = null;
    
    await jobMatch.save();

    // Trigger generation
    generateJobMatchAsync(resumeId, jobDescriptionId, userId).catch(error => {
      console.error(`Retry failed:`, error);
    });

    return jobMatch;
  } catch (error) {
    console.error('Error retrying job match:', error);
    throw error;
  }
};
