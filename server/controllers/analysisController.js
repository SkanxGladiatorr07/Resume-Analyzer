/**
 * Analysis Controller
 * Handles HTTP requests for resume analysis
 */

import * as analysisPipeline from '../services/analysisPipeline.js';
import Analysis from '../models/Analysis.js';

/**
 * @desc    Generate or retrieve analysis for a resume
 * @route   POST /api/analysis/:resumeId
 * @query   force=true to regenerate existing analysis
 * @access  Private
 */
export const generateAnalysis = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.id;
    const forceRegenerate = req.query.force === 'true';

    console.log(`📊 Analysis request for resume: ${resumeId}, force: ${forceRegenerate}`);

    // Check if analysis exists
    const existingAnalysis = await Analysis.findByResumeId(resumeId);

    if (forceRegenerate) {
      // Force regeneration
      if (!existingAnalysis) {
        // Create and trigger
        await analysisPipeline.createPendingAnalysis(resumeId, userId);
        await analysisPipeline.triggerAnalysisGeneration(resumeId, userId);
        
        const analysis = await Analysis.findByResumeId(resumeId);
        
        return res.status(202).json({
          success: true,
          status: 'processing',
          message: 'Analysis generation started',
          data: {
            analysisId: analysis._id,
            resumeId: analysis.resume,
            analysisStatus: analysis.analysisStatus,
          },
        });
      }

      // Regenerate existing
      const analysis = await analysisPipeline.regenerateAnalysis(resumeId, userId);
      
      return res.status(202).json({
        success: true,
        status: 'processing',
        message: 'Analysis regeneration started',
        data: {
          analysisId: analysis._id,
          resumeId: analysis.resume,
          analysisStatus: analysis.analysisStatus,
        },
      });
    }

    // Not forcing regeneration
    if (!existingAnalysis) {
      // No analysis exists, create and trigger
      await analysisPipeline.createPendingAnalysis(resumeId, userId);
      await analysisPipeline.triggerAnalysisGeneration(resumeId, userId);
      
      const analysis = await Analysis.findByResumeId(resumeId);
      
      return res.status(202).json({
        success: true,
        status: 'processing',
        message: 'Analysis generation started',
        data: {
          analysisId: analysis._id,
          resumeId: analysis.resume,
          analysisStatus: analysis.analysisStatus,
        },
      });
    }

    // Analysis exists, return based on status
    if (existingAnalysis.analysisStatus === 'completed') {
      // Return completed analysis
      return res.status(200).json({
        success: true,
        status: 'completed',
        cached: true,
        message: 'Using existing analysis. Use force=true to regenerate.',
        data: {
          analysisId: existingAnalysis._id,
          resumeId: existingAnalysis.resume,
          analysisStatus: existingAnalysis.analysisStatus,
          atsScore: existingAnalysis.atsScore,
          summary: existingAnalysis.summary,
          strengths: existingAnalysis.strengths,
          weaknesses: existingAnalysis.weaknesses,
          missingSkills: existingAnalysis.missingSkills,
          grammarFeedback: existingAnalysis.grammarFeedback,
          formattingFeedback: existingAnalysis.formattingFeedback,
          suggestions: existingAnalysis.suggestions,
          generatedAt: existingAnalysis.generatedAt,
          aiModel: existingAnalysis.aiModel,
        },
      });
    } else if (existingAnalysis.analysisStatus === 'processing') {
      // Still processing
      return res.status(202).json({
        success: true,
        status: 'processing',
        message: 'Analysis is currently being generated',
        data: {
          analysisId: existingAnalysis._id,
          resumeId: existingAnalysis.resume,
          analysisStatus: existingAnalysis.analysisStatus,
          analysisStartedAt: existingAnalysis.analysisStartedAt,
        },
      });
    } else if (existingAnalysis.analysisStatus === 'failed') {
      // Failed, offer retry
      return res.status(500).json({
        success: false,
        status: 'failed',
        message: 'Analysis generation failed. Use force=true to retry.',
        data: {
          analysisId: existingAnalysis._id,
          resumeId: existingAnalysis.resume,
          analysisStatus: existingAnalysis.analysisStatus,
          errorMessage: existingAnalysis.errorMessage,
        },
      });
    } else {
      // Pending
      return res.status(202).json({
        success: true,
        status: 'pending',
        message: 'Analysis is queued for generation',
        data: {
          analysisId: existingAnalysis._id,
          resumeId: existingAnalysis.resume,
          analysisStatus: existingAnalysis.analysisStatus,
        },
      });
    }
  } catch (error) {
    console.error('Analysis generation error:', error);

    // Determine appropriate status code
    let statusCode = 500;
    let message = 'Failed to generate analysis';

    if (error.message.includes('not found')) {
      statusCode = 404;
      message = error.message;
    } else if (error.message.includes('not authorized')) {
      statusCode = 403;
      message = error.message;
    } else if (error.message.includes('must be parsed')) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('No structured data')) {
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
 * @desc    Get existing analysis for a resume
 * @route   GET /api/analysis/:resumeId
 * @access  Private
 */
export const getAnalysis = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const analysis = await Analysis.findByResumeId(resumeId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No analysis found for this resume',
      });
    }

    res.status(200).json({
      success: true,
      status: analysis.analysisStatus,
      data: {
        analysisId: analysis._id,
        resumeId: analysis.resume,
        analysisStatus: analysis.analysisStatus,
        atsScore: analysis.atsScore,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missingSkills: analysis.missingSkills,
        grammarFeedback: analysis.grammarFeedback,
        formattingFeedback: analysis.formattingFeedback,
        suggestions: analysis.suggestions,
        generatedAt: analysis.generatedAt,
        aiModel: analysis.aiModel,
        errorMessage: analysis.errorMessage,
        isStale: analysis.isStale(),
      },
    });
  } catch (error) {
    console.error('Get analysis error:', error);

    let statusCode = 500;
    let message = 'Failed to retrieve analysis';

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
 * @desc    Delete analysis for a resume
 * @route   DELETE /api/analysis/:resumeId
 * @access  Private
 */
export const deleteAnalysis = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const analysis = await Analysis.findByResumeId(resumeId);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found',
      });
    }

    await Analysis.deleteOne({ _id: analysis._id });

    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully',
    });
  } catch (error) {
    console.error('Delete analysis error:', error);

    let statusCode = 500;
    let message = 'Failed to delete analysis';

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
 * @desc    Check if analysis exists for a resume
 * @route   GET /api/analysis/:resumeId/exists
 * @access  Private
 */
export const checkAnalysisExists = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const analysis = await Analysis.findByResumeId(resumeId);

    res.status(200).json({
      success: true,
      exists: !!analysis,
      status: analysis?.analysisStatus || null,
    });
  } catch (error) {
    console.error('Check analysis existence error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to check analysis existence',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get analysis status
 * @route   GET /api/analysis/:resumeId/status
 * @access  Private
 */
export const getAnalysisStatus = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const status = await analysisPipeline.getAnalysisStatus(resumeId);

    res.status(200).json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('Get analysis status error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get analysis status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Retry failed analysis
 * @route   POST /api/analysis/:resumeId/retry
 * @access  Private
 */
export const retryAnalysis = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.id;

    const analysis = await analysisPipeline.retryFailedAnalysis(resumeId, userId);

    res.status(202).json({
      success: true,
      status: 'processing',
      message: 'Analysis retry started',
      data: {
        analysisId: analysis._id,
        resumeId: analysis.resume,
        analysisStatus: analysis.analysisStatus,
      },
    });
  } catch (error) {
    console.error('Retry analysis error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retry analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
