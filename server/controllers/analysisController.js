/**
 * Analysis Controller
 * Handles HTTP requests for resume analysis
 */

import * as analysisService from '../services/analysisService.js';

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

    // Generate or retrieve analysis
    const result = await analysisService.generateAnalysis(
      resumeId,
      userId,
      forceRegenerate
    );

    // Determine status code
    const statusCode = result.cached && !forceRegenerate ? 200 : 201;

    res.status(statusCode).json({
      success: true,
      cached: result.cached,
      message: result.message,
      data: {
        analysisId: result.analysis._id,
        resumeId: result.analysis.resume,
        atsScore: result.analysis.atsScore,
        summary: result.analysis.summary,
        strengths: result.analysis.strengths,
        weaknesses: result.analysis.weaknesses,
        missingSkills: result.analysis.missingSkills,
        grammarFeedback: result.analysis.grammarFeedback,
        formattingFeedback: result.analysis.formattingFeedback,
        suggestions: result.analysis.suggestions,
        generatedAt: result.analysis.generatedAt,
        aiModel: result.analysis.aiModel,
      },
    });
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
    } else if (error.message.includes('Invalid AI response')) {
      statusCode = 500;
      message = 'AI service returned invalid data. Please try again.';
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
    const userId = req.user.id;

    const analysis = await analysisService.getAnalysis(resumeId, userId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No analysis found for this resume. Generate one first.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        analysisId: analysis._id,
        resumeId: analysis.resume,
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
    const userId = req.user.id;

    await analysisService.deleteAnalysis(resumeId, userId);

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

    const exists = await analysisService.analysisExists(resumeId);

    res.status(200).json({
      success: true,
      exists,
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
