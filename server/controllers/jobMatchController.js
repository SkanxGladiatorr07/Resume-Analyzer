/**
 * Job Match Controller
 * Handles HTTP requests for resume-to-job comparison
 */

import * as jobMatchPipeline from '../services/jobMatchPipeline.js';
import JobMatch from '../models/JobMatch.js';
import Resume from '../models/Resume.js';
import JobDescription from '../models/JobDescription.js';

// ============================================================================
// COMPARISON HISTORY ENDPOINTS
// ============================================================================

/**
 * @desc    Get all job match history for the authenticated user
 * @route   GET /api/job-match/history
 * @query   page, limit, status, sortBy, order
 * @access  Private
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

    // Build query
    const query = { user: userId };
    if (status) {
      query.matchStatus = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Fetch matches with population
    const matches = await JobMatch.find(query)
      .populate('resume', 'originalName fileSize createdAt')
      .populate('jobDescription', 'title company preview')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await JobMatch.countDocuments(query);

    console.log(`✅ Retrieved ${matches.length} matches (total: ${total})`);

    res.status(200).json({
      success: true,
      data: matches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get user job matches error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job match history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get specific job match from history by ID
 * @route   GET /api/job-match/history/:matchId
 * @access  Private
 */
export const getJobMatchHistory = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    console.log(`📖 Fetching job match - ID: ${matchId}, User: ${userId}`);

    // Find match by ID and verify ownership
    const jobMatch = await JobMatch.findById(matchId)
      .populate('resume', 'originalName fileSize createdAt')
      .populate('jobDescription', 'title company description');

    if (!jobMatch) {
      console.log(`❌ Job match not found - ID: ${matchId}`);
      return res.status(404).json({
        success: false,
        message: 'Job match not found',
      });
    }

    // Verify ownership
    if (jobMatch.user.toString() !== userId.toString()) {
      console.log(`❌ Unauthorized access attempt - Match: ${matchId}, User: ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job match',
      });
    }

    console.log(`✅ Job match retrieved - Status: ${jobMatch.matchStatus}, Score: ${jobMatch.matchScore}%`);

    res.status(200).json({
      success: true,
      data: jobMatch,
    });
  } catch (error) {
    console.error('❌ Get job match history error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================================
// COMPARISON GENERATION ENDPOINTS
// ============================================================================

/**
 * @desc    Generate or retrieve job match for a resume and job description
 * @route   POST /api/job-match/:resumeId/:jobDescriptionId
 * @query   force=true to regenerate existing match
 * @access  Private
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

    // Verify resume exists and belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.log(`❌ Resume not found - ID: ${resumeId}`);
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    if (resume.user.toString() !== userId.toString()) {
      console.log(`❌ Unauthorized resume access - Resume: ${resumeId}, User: ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume',
      });
    }

    if (resume.parsingStatus !== 'completed') {
      console.log(`❌ Resume not parsed - Status: ${resume.parsingStatus}`);
      return res.status(400).json({
        success: false,
        message: 'Resume must be successfully parsed before job matching',
      });
    }

    // Verify job description exists and belongs to user
    const jobDescription = await JobDescription.findById(jobDescriptionId);
    if (!jobDescription) {
      console.log(`❌ Job description not found - ID: ${jobDescriptionId}`);
      return res.status(404).json({
        success: false,
        message: 'Job description not found',
      });
    }

    if (jobDescription.user.toString() !== userId.toString()) {
      console.log(`❌ Unauthorized job description access - Job: ${jobDescriptionId}, User: ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job description',
      });
    }

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
        
        return res.status(202).json({
          success: true,
          status: 'processing',
          message: 'Job match generation started',
          data: {
            matchId: jobMatch._id,
            resumeId: jobMatch.resume,
            jobDescriptionId: jobMatch.jobDescription,
            matchStatus: jobMatch.matchStatus,
          },
        });
      }

      // Check if already processing
      if (existingMatch.matchStatus === 'processing') {
        console.log(`⏳ Match already processing - Cannot regenerate now`);
        return res.status(409).json({
          success: false,
          status: 'processing',
          message: 'Job match is currently being generated. Please wait for it to complete before regenerating.',
          data: {
            matchId: existingMatch._id,
            matchStatus: existingMatch.matchStatus,
            matchStartedAt: existingMatch.matchStartedAt,
          },
        });
      }

      // Regenerate existing
      console.log(`🔄 Regenerating existing job match - ID: ${existingMatch._id}`);
      const jobMatch = await jobMatchPipeline.regenerateJobMatch(resumeId, jobDescriptionId, userId);
      
      console.log(`✅ Job match regeneration started - ID: ${jobMatch._id}`);
      
      return res.status(202).json({
        success: true,
        status: 'processing',
        message: 'Job match regeneration started',
        data: {
          matchId: jobMatch._id,
          resumeId: jobMatch.resume,
          jobDescriptionId: jobMatch.jobDescription,
          matchStatus: jobMatch.matchStatus,
        },
      });
    }

    // Not forcing regeneration
    if (!existingMatch) {
      // No match exists, create and trigger
      console.log(`📝 No existing match found - Creating new`);
      await jobMatchPipeline.createPendingJobMatch(resumeId, jobDescriptionId, userId);
      await jobMatchPipeline.triggerJobMatchGeneration(resumeId, jobDescriptionId, userId);
      
      const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
      
      console.log(`✅ Job match generation started - ID: ${jobMatch._id}`);
      
      return res.status(202).json({
        success: true,
        status: 'processing',
        message: 'Job match generation started',
        data: {
          matchId: jobMatch._id,
          resumeId: jobMatch.resume,
          jobDescriptionId: jobMatch.jobDescription,
          matchStatus: jobMatch.matchStatus,
        },
      });
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
      
      return res.status(202).json({
        success: true,
        status: 'processing',
        message: 'Job match is currently being generated',
        data: {
          matchId: existingMatch._id,
          resumeId: existingMatch.resume,
          jobDescriptionId: existingMatch.jobDescription,
          matchStatus: existingMatch.matchStatus,
          matchStartedAt: existingMatch.matchStartedAt,
        },
      });
    } else if (existingMatch.matchStatus === 'failed') {
      // Failed, offer retry
      console.log(`❌ Previous match failed - ID: ${existingMatch._id}, Error: ${existingMatch.errorMessage}`);
      
      return res.status(500).json({
        success: false,
        status: 'failed',
        message: 'Job match generation failed. Use force=true to retry.',
        data: {
          matchId: existingMatch._id,
          resumeId: existingMatch.resume,
          jobDescriptionId: existingMatch.jobDescription,
          matchStatus: existingMatch.matchStatus,
          errorMessage: existingMatch.errorMessage,
        },
      });
    } else {
      // Pending
      console.log(`⏳ Match pending - ID: ${existingMatch._id}`);
      
      return res.status(202).json({
        success: true,
        status: 'pending',
        message: 'Job match is queued for generation',
        data: {
          matchId: existingMatch._id,
          resumeId: existingMatch.resume,
          jobDescriptionId: existingMatch.jobDescription,
          matchStatus: existingMatch.matchStatus,
        },
      });
    }
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error(`❌ Job match generation error (${elapsedTime}ms):`, error);

    // Determine appropriate status code
    let statusCode = 500;
    let message = 'Failed to generate job match';

    if (error.message.includes('not found')) {
      statusCode = 404;
      message = error.message;
    } else if (error.message.includes('not authorized')) {
      statusCode = 403;
      message = error.message;
    } else if (error.message.includes('must be parsed')) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('AI service is not available')) {
      statusCode = 503;
      message = error.message;
    } else if (error.message.includes('currently being generated')) {
      statusCode = 409;
      message = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get existing job match
 * @route   GET /api/job-match/:resumeId/:jobDescriptionId
 * @access  Private
 */
export const getJobMatch = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.params;
    const userId = req.user._id;

    console.log(`\n📖 Get job match request`);
    console.log(`   Resume ID: ${resumeId}`);
    console.log(`   Job Description ID: ${jobDescriptionId}`);
    console.log(`   User ID: ${userId}`);

    // Verify resume belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.log(`❌ Resume not found - ID: ${resumeId}`);
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    if (resume.user.toString() !== userId.toString()) {
      console.log(`❌ Unauthorized resume access`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume',
      });
    }

    // Verify job description belongs to user
    const jobDescription = await JobDescription.findById(jobDescriptionId);
    if (!jobDescription) {
      console.log(`❌ Job description not found - ID: ${jobDescriptionId}`);
      return res.status(404).json({
        success: false,
        message: 'Job description not found',
      });
    }

    if (jobDescription.user.toString() !== userId.toString()) {
      console.log(`❌ Unauthorized job description access`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job description',
      });
    }

    // Find match
    const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);

    if (!jobMatch) {
      console.log(`❌ No job match found`);
      return res.status(404).json({
        success: false,
        message: 'No job match found for this resume and job description',
      });
    }

    console.log(`✅ Job match found - Status: ${jobMatch.matchStatus}, Score: ${jobMatch.matchScore}%`);

    res.status(200).json({
      success: true,
      status: jobMatch.matchStatus,
      data: {
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
    });
  } catch (error) {
    console.error('❌ Get job match error:', error);

    let statusCode = 500;
    let message = 'Failed to retrieve job match';

    if (error.message.includes('not found')) {
      statusCode = 404;
      message = error.message;
    } else if (error.message.includes('not authorized')) {
      statusCode = 403;
      message = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get job match status
 * @route   GET /api/job-match/:resumeId/:jobDescriptionId/status
 * @access  Private
 */
export const getJobMatchStatus = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.params;
    const userId = req.user._id;

    console.log(`📊 Get job match status - Resume: ${resumeId}, Job: ${jobDescriptionId}`);

    // Verify ownership (lightweight check)
    const resume = await Resume.findById(resumeId).select('user');
    if (!resume || resume.user.toString() !== userId.toString()) {
      console.log(`❌ Unauthorized access`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const status = await jobMatchPipeline.getJobMatchStatus(resumeId, jobDescriptionId);

    console.log(`✅ Status retrieved - Exists: ${status.exists}, Status: ${status.status}`);

    res.status(200).json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('❌ Get job match status error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get job match status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete job match
 * @route   DELETE /api/job-match/:resumeId/:jobDescriptionId
 * @access  Private
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
    const resume = await Resume.findById(resumeId).select('user');
    if (!resume || resume.user.toString() !== userId.toString()) {
      console.log(`❌ Unauthorized access`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
    
    if (!jobMatch) {
      console.log(`❌ Job match not found`);
      return res.status(404).json({
        success: false,
        message: 'Job match not found',
      });
    }

    // Don't allow deleting while processing
    if (jobMatch.matchStatus === 'processing') {
      console.log(`❌ Cannot delete while processing`);
      return res.status(409).json({
        success: false,
        message: 'Cannot delete job match while it is being generated',
      });
    }

    await JobMatch.deleteOne({ _id: jobMatch._id });

    console.log(`✅ Job match deleted - ID: ${jobMatch._id}`);

    res.status(200).json({
      success: true,
      message: 'Job match deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete job match error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete job match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
