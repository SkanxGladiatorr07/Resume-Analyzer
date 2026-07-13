/**
 * Job Match Controller
 * Handles HTTP requests for resume-to-job comparison
 */

import * as jobMatchPipeline from '../services/jobMatchPipeline.js';
import JobMatch from '../models/JobMatch.js';
import Resume from '../models/Resume.js';
import JobDescription from '../models/JobDescription.js';

/**
 * @desc    Generate or retrieve job match for a resume and job description
 * @route   POST /api/job-match/:resumeId/:jobDescriptionId
 * @query   force=true to regenerate existing match
 * @access  Private
 */
export const generateJobMatch = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.params;
    const userId = req.user._id;
    const forceRegenerate = req.query.force === 'true';

    console.log(`📊 Job match request - Resume: ${resumeId}, Job: ${jobDescriptionId}, Force: ${forceRegenerate}`);

    // Verify resume exists and belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    if (resume.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume',
      });
    }

    if (resume.parsingStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Resume must be successfully parsed before job matching',
      });
    }

    // Verify job description exists and belongs to user
    const jobDescription = await JobDescription.findById(jobDescriptionId);
    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message: 'Job description not found',
      });
    }

    if (jobDescription.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job description',
      });
    }

    // Check if match exists
    const existingMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);

    if (forceRegenerate) {
      // Force regeneration
      if (!existingMatch) {
        // Create and trigger
        await jobMatchPipeline.createPendingJobMatch(resumeId, jobDescriptionId, userId);
        await jobMatchPipeline.triggerJobMatchGeneration(resumeId, jobDescriptionId, userId);
        
        const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
        
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

      // Regenerate existing
      const jobMatch = await jobMatchPipeline.regenerateJobMatch(resumeId, jobDescriptionId, userId);
      
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
      await jobMatchPipeline.createPendingJobMatch(resumeId, jobDescriptionId, userId);
      await jobMatchPipeline.triggerJobMatchGeneration(resumeId, jobDescriptionId, userId);
      
      const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
      
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
    if (existingMatch.matchStatus === 'completed') {
      // Return completed match
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
      // Still processing
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
    console.error('Job match generation error:', error);

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

    // Verify resume belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    if (resume.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume',
      });
    }

    // Verify job description belongs to user
    const jobDescription = await JobDescription.findById(jobDescriptionId);
    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message: 'Job description not found',
      });
    }

    if (jobDescription.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job description',
      });
    }

    // Find match
    const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);

    if (!jobMatch) {
      return res.status(404).json({
        success: false,
        message: 'No job match found for this resume and job description',
      });
    }

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
    console.error('Get job match error:', error);

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

    // Verify ownership (lightweight check)
    const resume = await Resume.findById(resumeId).select('user');
    if (!resume || resume.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const status = await jobMatchPipeline.getJobMatchStatus(resumeId, jobDescriptionId);

    res.status(200).json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('Get job match status error:', error);

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

    // Verify ownership
    const resume = await Resume.findById(resumeId).select('user');
    if (!resume || resume.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const jobMatch = await JobMatch.findByResumeAndJob(resumeId, jobDescriptionId);
    
    if (!jobMatch) {
      return res.status(404).json({
        success: false,
        message: 'Job match not found',
      });
    }

    await JobMatch.deleteOne({ _id: jobMatch._id });

    res.status(200).json({
      success: true,
      message: 'Job match deleted successfully',
    });
  } catch (error) {
    console.error('Delete job match error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete job match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
