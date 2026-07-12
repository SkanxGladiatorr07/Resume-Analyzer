/**
 * Analysis Service
 * Handles resume analysis generation, validation, and caching
 */

import Analysis from '../models/Analysis.js';
import Resume from '../models/Resume.js';
import * as geminiService from './geminiService.js';
import * as prompts from '../prompts/resumeAnalysisPrompts.js';

/**
 * Validate analysis response structure
 * @param {Object} data - Analysis data to validate
 * @returns {Object} Validation result
 */
const validateAnalysisStructure = (data) => {
  const errors = [];

  // Check required fields
  if (typeof data.atsScore !== 'number') {
    errors.push('atsScore must be a number');
  } else if (data.atsScore < 0 || data.atsScore > 100) {
    errors.push('atsScore must be between 0 and 100');
  }

  if (typeof data.summary !== 'string' || data.summary.trim() === '') {
    errors.push('summary must be a non-empty string');
  }

  // Check arrays
  const arrayFields = [
    'strengths',
    'weaknesses',
    'missingSkills',
    'grammarFeedback',
    'formattingFeedback',
    'suggestions',
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(data[field])) {
      errors.push(`${field} must be an array`);
    } else {
      // Check all items are strings
      const nonStrings = data[field].filter(item => typeof item !== 'string');
      if (nonStrings.length > 0) {
        errors.push(`${field} must contain only strings`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize and normalize analysis data
 * @param {Object} data - Raw analysis data
 * @returns {Object} Sanitized data
 */
const sanitizeAnalysisData = (data) => {
  return {
    atsScore: Math.round(Math.max(0, Math.min(100, Number(data.atsScore)))),
    summary: String(data.summary || '').trim(),
    strengths: (Array.isArray(data.strengths) ? data.strengths : [])
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => item.trim())
      .slice(0, 20), // Limit to 20 items
    weaknesses: (Array.isArray(data.weaknesses) ? data.weaknesses : [])
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => item.trim())
      .slice(0, 20),
    missingSkills: (Array.isArray(data.missingSkills) ? data.missingSkills : [])
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => item.trim())
      .slice(0, 20),
    grammarFeedback: (Array.isArray(data.grammarFeedback) ? data.grammarFeedback : [])
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => item.trim())
      .slice(0, 20),
    formattingFeedback: (Array.isArray(data.formattingFeedback) ? data.formattingFeedback : [])
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => item.trim())
      .slice(0, 20),
    suggestions: (Array.isArray(data.suggestions) ? data.suggestions : [])
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => item.trim())
      .slice(0, 20),
  };
};

/**
 * Generate analysis for a resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 * @param {boolean} forceRegenerate - Force regeneration even if analysis exists
 * @returns {Promise<Object>} Analysis result
 */
export const generateAnalysis = async (resumeId, userId, forceRegenerate = false) => {
  try {
    console.log(`🔍 Starting analysis generation for resume: ${resumeId}`);

    // Check if Gemini is available
    if (!geminiService.isGeminiAvailable()) {
      throw new Error('AI service is not available. Please configure Gemini API key.');
    }

    // Fetch resume
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    // Verify ownership
    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to analyze this resume');
    }

    // Check parsing status
    if (resume.parsingStatus !== 'completed') {
      throw new Error('Resume must be successfully parsed before analysis');
    }

    // Check structured data
    if (!resume.structuredData) {
      throw new Error('No structured data available for analysis');
    }

    // Check if analysis already exists
    if (!forceRegenerate) {
      const existingAnalysis = await Analysis.findByResumeId(resumeId);
      if (existingAnalysis) {
        console.log(`✅ Using cached analysis for resume: ${resumeId}`);
        return {
          success: true,
          cached: true,
          analysis: existingAnalysis,
          message: 'Using existing analysis. Use force=true to regenerate.',
        };
      }
    } else {
      // Delete existing analysis if forcing regeneration
      await Analysis.deleteByResumeId(resumeId);
      console.log(`🔄 Forcing regeneration for resume: ${resumeId}`);
    }

    // Generate prompt
    console.log('📝 Generating analysis prompt...');
    const prompt = prompts.generateStructuredAnalysisPrompt(resume.structuredData);

    // Call Gemini AI
    console.log('🤖 Calling Gemini AI...');
    const aiResponse = await geminiService.generateContent(prompt, true);

    // Validate response structure
    console.log('✔️  Validating AI response...');
    const validation = validateAnalysisStructure(aiResponse);
    
    if (!validation.valid) {
      console.error('❌ AI response validation failed:', validation.errors);
      throw new Error(`Invalid AI response structure: ${validation.errors.join(', ')}`);
    }

    // Sanitize data
    console.log('🧹 Sanitizing analysis data...');
    const sanitizedData = sanitizeAnalysisData(aiResponse);

    // Save analysis to database
    console.log('💾 Saving analysis to database...');
    const analysis = new Analysis({
      resume: resumeId,
      user: userId,
      ...sanitizedData,
      forcedRegeneration: forceRegenerate,
    });

    await analysis.save();

    console.log(`✅ Analysis generated and saved successfully for resume: ${resumeId}`);

    return {
      success: true,
      cached: false,
      analysis,
      message: 'Analysis generated successfully',
    };
  } catch (error) {
    console.error('❌ Analysis generation error:', error);
    
    // Log AI-specific errors
    if (error.message.includes('Gemini') || error.message.includes('AI')) {
      console.error('🤖 AI Service Error Details:', {
        resumeId,
        userId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }

    throw error;
  }
};

/**
 * Get existing analysis for a resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Analysis or null
 */
export const getAnalysis = async (resumeId, userId) => {
  try {
    // Fetch resume to verify ownership
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    // Verify ownership
    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to access this analysis');
    }

    // Fetch analysis
    const analysis = await Analysis.findByResumeId(resumeId);

    return analysis;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    throw error;
  }
};

/**
 * Delete analysis for a resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteAnalysis = async (resumeId, userId) => {
  try {
    // Fetch resume to verify ownership
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    // Verify ownership
    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete this analysis');
    }

    // Delete analysis
    await Analysis.deleteByResumeId(resumeId);

    console.log(`🗑️  Analysis deleted for resume: ${resumeId}`);

    return true;
  } catch (error) {
    console.error('Error deleting analysis:', error);
    throw error;
  }
};

/**
 * Check if analysis exists for a resume
 * @param {string} resumeId - Resume ID
 * @returns {Promise<boolean>} Whether analysis exists
 */
export const analysisExists = async (resumeId) => {
  try {
    const analysis = await Analysis.findByResumeId(resumeId);
    return !!analysis;
  } catch (error) {
    console.error('Error checking analysis existence:', error);
    return false;
  }
};
