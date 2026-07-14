/**
 * Job Match Controller
 * Handles HTTP requests for resume-to-job comparison
 */

import * as jobMatchPipeline from '../services/jobMatchPipeline.js';
import JobMatch from '../models/JobMatch.js';
import Resume from '../models/Resume.js';
import * as authUtils from '../utils/authUtils.js';
import * as responseUtils from '../utils/responseUtils.js';

// ============================================================================
// COMPARISON HISTORY ENDPOINTS
// ============================================================================

/**
 * @desc    Get all job match history for the authenticated user
 * @route   GET /api/job-match/history
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 50)
 * @query   status - Filter by status (pending, processing, completed, failed)
 * @query   sortBy - Sort field (default: createdAt)
 * @query   order - Sort order: asc, desc (default: desc)
 * @access  Private - Requires authentication
 */
export const getUserJobMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    console.log(`📚 Fetching job match history - User: ${userId}, Page: ${page}, Status: ${status || 'all'}`);

    // Validate and sanitize pagination params
    const sanitizedLimit = Math.min(Math.max(1, parseInt(limit)), 50);
    const sanitizedPage = Math.max(1, parseInt(page));

    // Build query
    const query = { user: userId };
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      query.matchStatus = status;
    }

    // Calculate pagination
    const skip = (sanitizedPage - 1) * sanitizedLimit;
    const sortOrder = order === 'asc' ? 1 : -1;

    // Fetch matches with population
    const matches = await JobMatch.find(query)
      .populate('resume', 'originalName fileSize createdAt')
      .populate('jobDescription', 'title company preview')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(sanitizedLimit);

    // Get total count
    const total = await JobMatch.countDocuments(query);

    console.log(`✅ Retrieved ${matches.length} matches (total: ${total})`);

    const pagination = responseUtils.createPagination(sanitizedPage, sanitizedLimit, total);

    return responseUtils.sendSuccessWithPagination(
      res,
      matches,
      pagination,
      'Job match history retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get user job matches error:', error);
    return responseUtils.handleError(res, error, 'Failed to retrieve job match history');
  }
};

/**
 * @desc    Get specific job match from history by ID
 * @route   GET /api/job-match/history/:matchId
 * @param   matchId - Job match ID
 * @access  Private - Requires authentication, ownership verification
 */
export const getJobMatchHistory = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    console.log(`📖 Fetching job match - ID: ${matchId}, User: ${userId}`);

    // Verify ownership and fetch match
    const jobMatch = await authUtils.verifyJobMatchOwnership(matchId, userId);

    // Populate related documents
    await jobMatch.populate('resume', 'originalName fileSize createdAt');
    await jobMatch.populate('jobDescription', 'title company description');

    console.log(`✅ Job match retrieved - Status: ${jobMatch.matchStatus}, Score: ${jobMatch.matchScore}%`);

    return responseUtils.sendSuccess(
      res,
      jobMatch,
      'Job match retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get job match history error:', error);
    return responseUtils.handleError(res, error, 'Failed to retrieve job match');
  }
};

// ============================================================================
// COMPARISON GENERATION ENDPOINTS
// ============================================================================

/**
 * @desc    Generate or retrieve job match for a resume and job description
 * @route   POST /api/job-match/:resumeId/:jobDescriptionId
 * @query   force - Set to 'true' to force regeneration of existing match
 * @param   resumeId - Resume ID
 * @param   jobDescriptionId - Job Description ID
 * @access  Private - Requires authentication, triple ownership verification
 */
export const generateJobMatch = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { resumeId, jobDescriptionId } = req.params;
    const userId = req.user._id;
    const forceRegenerate = req.query.force === 'true';

    console.log(`\n📊 Job match request received`);
    console.log(`   Resume ID: ${resumeId}`);
    console.log(`   Job Description ID: ${jobDescriptionId}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Force Regenerate: ${forceRegenerate}`);

    // Verify ownership of both resume and job description
    const { resume, jobDescription } = await authUtils.verifyJobMatchResources(
      resumeId,
      jobDescriptionId,
      userId
    );

    console.log(`✅ Resources verified - Resume: "${resume.originalName}", Job: "${jobDescription.title}"`);

    // Check if match exists
    const existingMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);

    if (forceRegenerate) {
      console.log(`🔄 Force regeneration requested`);
      
      if (!existingMatch) {
        // Create and trigger
        console.log(`📝 Creating new job match`);
        await jobMatchPipeline.createPendingJobMatch(resumeId, jobDescriptionId, userId);
        await jobMatchPipeline.triggerJobMatchGeneration(resumeId, jobDescriptionId, userId);
        
        const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
        
        console.log(`✅ Job match generation started (new) - ID: ${jobMatch._id}`);
        
        return responseUtils.sendProcessing(
          res,
          {
            matchId: jobMatch._id,
            resumeId: jobMatch.resume,
            jobDescriptionId: jobMatch.jobDescription,
            matchStatus: jobMatch.matchStatus,
          },
          'Job match generation started'
        );
      }

      // Check if already processing
      if (existingMatch.matchStatus === 'processing') {
        console.log(`⏳ Match already processing - Cannot regenerate now`);
        return responseUtils.sendConflict(
          res,
          'Job match is currently being generated. Please wait for it to complete before regenerating.'
        );
      }

      // Regenerate existing
      console.log(`🔄 Regenerating existing job match - ID: ${existingMatch._id}`);
      const jobMatch = await jobMatchPipeline.regenerateJobMatch(resumeId, jobDescriptionId, userId);
      
      console.log(`✅ Job match regeneration started - ID: ${jobMatch._id}`);
      
      return responseUtils.sendProcessing(
        res,
        {
          matchId: jobMatch._id,
          resumeId: jobMatch.resume,
          jobDescriptionId: jobMatch.jobDescription,
          matchStatus: jobMatch.matchStatus,
        },
        'Job match regeneration started'
      );
    }

    // Not forcing regeneration
    if (!existingMatch) {
      // No match exists, create and trigger
      console.log(`📝 No existing match found - Creating new`);
      await jobMatchPipeline.createPendingJobMatch(resumeId, jobDescriptionId, userId);
      await jobMatchPipeline.triggerJobMatchGeneration(resumeId, jobDescriptionId, userId);
      
      const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
      
      console.log(`✅ Job match generation started - ID: ${jobMatch._id}`);
      
      return responseUtils.sendProcessing(
        res,
        {
          matchId: jobMatch._id,
          resumeId: jobMatch.resume,
          jobDescriptionId: jobMatch.jobDescription,
          matchStatus: jobMatch.matchStatus,
        },
        'Job match generation started'
      );
    }

    // Match exists, return based on status
    console.log(`📋 Existing match found - Status: ${existingMatch.matchStatus}`);
    
    if (existingMatch.matchStatus === 'completed') {
      // Return completed match
      const elapsedTime = Date.now() - startTime;
      console.log(`✅ Returning cached match - ID: ${existingMatch._id}, Score: ${existingMatch.matchScore}% (${elapsedTime}ms)`);
      
      return res.status(200).json({
        success: true,
        status: 'completed',
        cached: true,
        message: 'Using existing job match. Use force=true to regenerate.',
        data: {
          matchId: existingMatch._id,
          resumeId: existingMatch.resume,
          jobDescriptionId: existingMatch.jobDescription,
          matchStatus: existingMatch.matchStatus,
          matchScore: existingMatch.matchScore,
          summary: existingMatch.summary,
          matchingSkills: existingMatch.matchingSkills,
          missingTechnicalSkills: existingMatch.missingTechnicalSkills,
          missingSoftSkills: existingMatch.missingSoftSkills,
          missingKeywords: existingMatch.missingKeywords,
          strengths: existingMatch.strengths,
          recommendations: existingMatch.recommendations,
          atsOptimizationTips: existingMatch.atsOptimizationTips,
          confidenceScore: existingMatch.confidenceScore,
          generatedAt: existingMatch.generatedAt,
          aiModel: existingMatch.aiModel,
        },
      });
    } else if (existingMatch.matchStatus === 'processing') {
      // Still processing - prevent duplicate requests
      console.log(`⏳ Match still processing - ID: ${existingMatch._id}`);
      
      return responseUtils.sendProcessing(
        res,
        {
          matchId: existingMatch._id,
          resumeId: existingMatch.resume,
          jobDescriptionId: existingMatch.jobDescription,
          matchStatus: existingMatch.matchStatus,
          matchStartedAt: existingMatch.matchStartedAt,
        },
        'Job match is currently being generated'
      );
    } else if (existingMatch.matchStatus === 'failed') {
      // Failed, offer retry
      console.log(`❌ Previous match failed - ID: ${existingMatch._id}, Error: ${existingMatch.errorMessage}`);
      
      return responseUtils.sendError(
        res,
        'Job match generation failed. Use force=true to retry.',
        500
      );
    } else {
      // Pending
      console.log(`⏳ Match pending - ID: ${existingMatch._id}`);
      
      return responseUtils.sendProcessing(
        res,
        {
          matchId: existingMatch._id,
          resumeId: existingMatch.resume,
          jobDescriptionId: existingMatch.jobDescription,
          matchStatus: existingMatch.matchStatus,
        },
        'Job match is queued for generation'
      );
    }
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error(`❌ Job match generation error (${elapsedTime}ms):`, error);

    return responseUtils.handleError(res, error, 'Failed to generate job match');
  }
};

/**
 * @desc    Get existing job match
 * @route   GET /api/job-match/:resumeId/:jobDescriptionId
 * @param   resumeId - Resume ID
 * @param   jobDescriptionId - Job Description ID
 * @access  Private - Requires authentication, ownership verification
 */
export const getJobMatch = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.params;
    const userId = req.user._id;

    console.log(`\n📖 Get job match request`);
    console.log(`   Resume ID: ${resumeId}`);
    console.log(`   Job Description ID: ${jobDescriptionId}`);
    console.log(`   User ID: ${userId}`);

    // Verify ownership of both resources
    await authUtils.verifyJobMatchResources(resumeId, jobDescriptionId, userId);

    // Find match
    const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);

    if (!jobMatch) {
      console.log(`❌ No job match found`);
      return responseUtils.sendNotFound(res, 'Job match');
    }

    console.log(`✅ Job match found - Status: ${jobMatch.matchStatus}, Score: ${jobMatch.matchScore}%`);

    return responseUtils.sendSuccess(
      res,
      {
        matchId: jobMatch._id,
        resumeId: jobMatch.resume,
        jobDescriptionId: jobMatch.jobDescription,
        matchStatus: jobMatch.matchStatus,
        matchScore: jobMatch.matchScore,
        summary: jobMatch.summary,
        matchingSkills: jobMatch.matchingSkills,
        missingTechnicalSkills: jobMatch.missingTechnicalSkills,
        missingSoftSkills: jobMatch.missingSoftSkills,
        missingKeywords: jobMatch.missingKeywords,
        strengths: jobMatch.strengths,
        recommendations: jobMatch.recommendations,
        atsOptimizationTips: jobMatch.atsOptimizationTips,
        confidenceScore: jobMatch.confidenceScore,
        generatedAt: jobMatch.generatedAt,
        aiModel: jobMatch.aiModel,
        errorMessage: jobMatch.errorMessage,
        isStale: jobMatch.isStale(),
      },
      'Job match retrieved successfully'
    );
  } catch (error) {
    console.error('❌ Get job match error:', error);
    return responseUtils.handleError(res, error, 'Failed to retrieve job match');
  }
};

/**
 * @desc    Get job match status
 * @route   GET /api/job-match/:resumeId/:jobDescriptionId/status
 * @param   resumeId - Resume ID
 * @param   jobDescriptionId - Job Description ID
 * @access  Private - Requires authentication, lightweight ownership check
 */
export const getJobMatchStatus = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.params;
    const userId = req.user._id;

    console.log(`📊 Get job match status - Resume: ${resumeId}, Job: ${jobDescriptionId}`);

    // Lightweight ownership check
    const isOwned = await authUtils.quickOwnershipCheck(Resume, resumeId, userId);
    if (!isOwned) {
      console.log(`❌ Unauthorized access`);
      return responseUtils.sendUnauthorized(res);
    }

    const status = await jobMatchPipeline.getJobMatchStatus(resumeId, jobDescriptionId);

    console.log(`✅ Status retrieved - Exists: ${status.exists}, Status: ${status.status}`);

    return responseUtils.sendSuccess(res, status, 'Status retrieved successfully');
  } catch (error) {
    console.error('❌ Get job match status error:', error);
    return responseUtils.handleError(res, error, 'Failed to get job match status');
  }
};

/**
 * @desc    Delete job match
 * @route   DELETE /api/job-match/:resumeId/:jobDescriptionId
 * @param   resumeId - Resume ID
 * @param   jobDescriptionId - Job Description ID
 * @access  Private - Requires authentication, ownership verification
 */
export const deleteJobMatch = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.params;
    const userId = req.user._id;

    console.log(`\n🗑️  Delete job match request`);
    console.log(`   Resume ID: ${resumeId}`);
    console.log(`   Job Description ID: ${jobDescriptionId}`);
    console.log(`   User ID: ${userId}`);

    // Verify ownership
    const isOwned = await authUtils.quickOwnershipCheck(Resume, resumeId, userId);
    if (!isOwned) {
      console.log(`❌ Unauthorized access`);
      return responseUtils.sendUnauthorized(res);
    }

    const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
    
    if (!jobMatch) {
      console.log(`❌ Job match not found`);
      return responseUtils.sendNotFound(res, 'Job match');
    }

    // Don't allow deleting while processing
    if (jobMatch.matchStatus === 'processing') {
      console.log(`❌ Cannot delete while processing`);
      return responseUtils.sendConflict(
        res,
        'Cannot delete job match while it is being generated'
      );
    }

    await JobMatch.deleteOne({ _id: jobMatch._id });

    console.log(`✅ Job match deleted - ID: ${jobMatch._id}`);

    return responseUtils.sendSuccess(res, null, 'Job match deleted successfully');
  } catch (error) {
    console.error('❌ Delete job match error:', error);
    return responseUtils.handleError(res, error, 'Failed to delete job match');
  }
};
