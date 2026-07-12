/**
 * AI Controller
 * Handles HTTP requests for AI-powered analysis
 */

import Resume from '../models/Resume.js';
import * as aiAnalysisService from '../services/aiAnalysisService.js';

/**
 * @desc    Analyze resume comprehensively
 * @route   POST /api/ai/analyze/:id
 * @access  Private
 */
export const analyzeResume = async (req, res) => {
  try {
    // Resume ownership already verified by middleware
    const resume = await Resume.findById(req.params.id);

    // Check if resume is parsed
    if (resume.parsingStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Resume must be successfully parsed before analysis',
        parsingStatus: resume.parsingStatus,
      });
    }

    // Check if structured data exists
    if (!resume.structuredData) {
      return res.status(400).json({
        success: false,
        message: 'No structured data available for analysis',
      });
    }

    // Perform analysis
    const result = await aiAnalysisService.analyzeResumeComprehensive(resume.structuredData);

    res.status(200).json({
      success: true,
      data: {
        resumeId: resume._id,
        resumeName: resume.originalName,
        ...result,
      },
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze resume',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Analyze ATS compatibility
 * @route   POST /api/ai/ats-score/:id
 * @access  Private
 */
export const analyzeATSScore = async (req, res) => {
  try {
    // Resume ownership already verified by middleware
    const resume = await Resume.findById(req.params.id);

    // Check if resume is parsed
    if (resume.parsingStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Resume must be successfully parsed before ATS analysis',
        parsingStatus: resume.parsingStatus,
      });
    }

    // Check if structured data exists
    if (!resume.structuredData) {
      return res.status(400).json({
        success: false,
        message: 'No structured data available for ATS analysis',
      });
    }

    // Perform ATS analysis
    const result = await aiAnalysisService.analyzeATSCompatibility(resume.structuredData);

    res.status(200).json({
      success: true,
      data: {
        resumeId: resume._id,
        resumeName: resume.originalName,
        ...result,
      },
    });
  } catch (error) {
    console.error('ATS analysis error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze ATS compatibility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Analyze skill gaps
 * @route   POST /api/ai/skill-gap/:id
 * @access  Private
 */
export const analyzeSkillGap = async (req, res) => {
  try {
    const { targetRole } = req.body;

    // Resume ownership already verified by middleware
    const resume = await Resume.findById(req.params.id);

    // Check if resume is parsed
    if (resume.parsingStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Resume must be successfully parsed before skill gap analysis',
        parsingStatus: resume.parsingStatus,
      });
    }

    // Check if structured data exists
    if (!resume.structuredData) {
      return res.status(400).json({
        success: false,
        message: 'No structured data available for skill gap analysis',
      });
    }

    // Perform skill gap analysis
    const result = await aiAnalysisService.analyzeSkillGaps(
      resume.structuredData,
      targetRole || 'Software Engineer'
    );

    res.status(200).json({
      success: true,
      data: {
        resumeId: resume._id,
        resumeName: resume.originalName,
        ...result,
      },
    });
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze skill gaps',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Generate improvement suggestions
 * @route   POST /api/ai/improvements/:id
 * @access  Private
 */
export const generateImprovements = async (req, res) => {
  try {
    // Resume ownership already verified by middleware
    const resume = await Resume.findById(req.params.id);

    // Check if resume is parsed
    if (resume.parsingStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Resume must be successfully parsed before generating improvements',
        parsingStatus: resume.parsingStatus,
      });
    }

    // Check if structured data exists
    if (!resume.structuredData) {
      return res.status(400).json({
        success: false,
        message: 'No structured data available for generating improvements',
      });
    }

    // Generate improvements
    const result = await aiAnalysisService.generateImprovements(resume.structuredData);

    res.status(200).json({
      success: true,
      data: {
        resumeId: resume._id,
        resumeName: resume.originalName,
        ...result,
      },
    });
  } catch (error) {
    console.error('Improvement generation error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate improvements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Extract and analyze keywords
 * @route   POST /api/ai/keywords/:id
 * @access  Private
 */
export const extractKeywords = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    // Resume ownership already verified by middleware
    const resume = await Resume.findById(req.params.id);

    // Check if resume is parsed
    if (resume.parsingStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Resume must be successfully parsed before keyword extraction',
        parsingStatus: resume.parsingStatus,
      });
    }

    // Check if structured data exists
    if (!resume.structuredData) {
      return res.status(400).json({
        success: false,
        message: 'No structured data available for keyword extraction',
      });
    }

    // Extract keywords
    const result = await aiAnalysisService.extractKeywords(
      resume.structuredData,
      jobDescription
    );

    res.status(200).json({
      success: true,
      data: {
        resumeId: resume._id,
        resumeName: resume.originalName,
        ...result,
      },
    });
  } catch (error) {
    console.error('Keyword extraction error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to extract keywords',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get AI service status
 * @route   GET /api/ai/status
 * @access  Private
 */
export const getAIStatus = async (req, res) => {
  try {
    const info = aiAnalysisService.getAIInfo();
    
    res.status(200).json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error('AI status error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get AI status',
    });
  }
};

/**
 * @desc    Test AI connection
 * @route   GET /api/ai/test
 * @access  Private
 */
export const testAI = async (req, res) => {
  try {
    const result = await aiAnalysisService.testAIConnection();
    
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('AI test error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to test AI connection',
    });
  }
};
