/**
 * Analysis Pipeline Service
 * Orchestrates the analysis generation workflow
 * Handles automatic triggering, status tracking, and error recovery
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
      .slice(0, 20),
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
 * Create a pending analysis entry
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Analysis document
 */
export const createPendingAnalysis = async (resumeId, userId) => {
  try {
    // Check if analysis already exists
    const existing = await Analysis.findByResumeId(resumeId);
    
    if (existing) {
      console.log(`⏭️  Analysis already exists for resume ${resumeId} (status: ${existing.analysisStatus})`);
      return existing;
    }

    // Create pending analysis
    const analysis = new Analysis({
      resume: resumeId,
      user: userId,
      analysisStatus: 'pending',
    });

    await analysis.save();
    console.log(`📝 Created pending analysis for resume ${resumeId}`);
    
    return analysis;
  } catch (error) {
    console.error('Error creating pending analysis:', error);
    throw error;
  }
};

/**
 * Trigger analysis generation (async, non-blocking)
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 */
export const triggerAnalysisGeneration = async (resumeId, userId) => {
  // Run in background (don't await)
  generateAnalysisAsync(resumeId, userId).catch(error => {
    console.error(`❌ Background analysis generation failed for resume ${resumeId}:`, error);
  });
  
  console.log(`🚀 Analysis generation triggered for resume ${resumeId}`);
};

/**
 * Generate analysis asynchronously
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 */
const generateAnalysisAsync = async (resumeId, userId) => {
  let analysis = null;
  
  try {
    console.log(`\n🔄 Starting background analysis generation for resume ${resumeId}`);

    // Check if Gemini is available
    if (!geminiService.isGeminiAvailable()) {
      throw new Error('AI service is not available. Please configure Gemini API key.');
    }

    // Find or create analysis
    analysis = await Analysis.findByResumeId(resumeId);
    
    if (!analysis) {
      analysis = await createPendingAnalysis(resumeId, userId);
    }

    // Check if already processing
    if (analysis.analysisStatus === 'processing') {
      console.log(`⏳ Analysis already processing for resume ${resumeId}`);
      return;
    }

    // Update status to processing
    analysis.analysisStatus = 'processing';
    analysis.analysisStartedAt = new Date();
    analysis.retryCount = (analysis.retryCount || 0) + 1;
    await analysis.save();

    console.log(`⚙️  Analysis status updated to 'processing'`);

    // Fetch resume
    const resume = await Resume.findById(resumeId);
    
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.parsingStatus !== 'completed') {
      throw new Error('Resume must be successfully parsed before analysis');
    }

    if (!resume.structuredData) {
      throw new Error('No structured data available for analysis');
    }

    // Generate prompt
    console.log(`📝 Generating analysis prompt...`);
    const prompt = prompts.generateStructuredAnalysisPrompt(resume.structuredData);

    // Call Gemini AI
    console.log(`🤖 Calling Gemini AI...`);
    const aiResponse = await geminiService.generateContent(prompt, true);

    // Validate response
    console.log(`✔️  Validating AI response...`);
    const validation = validateAnalysisStructure(aiResponse);
    
    if (!validation.valid) {
      throw new Error(`Invalid AI response: ${validation.errors.join(', ')}`);
    }

    // Sanitize data
    console.log(`🧹 Sanitizing analysis data...`);
    const sanitizedData = sanitizeAnalysisData(aiResponse);

    // Update analysis with results
    analysis.analysisStatus = 'completed';
    analysis.atsScore = sanitizedData.atsScore;
    analysis.summary = sanitizedData.summary;
    analysis.strengths = sanitizedData.strengths;
    analysis.weaknesses = sanitizedData.weaknesses;
    analysis.missingSkills = sanitizedData.missingSkills;
    analysis.grammarFeedback = sanitizedData.grammarFeedback;
    analysis.formattingFeedback = sanitizedData.formattingFeedback;
    analysis.suggestions = sanitizedData.suggestions;
    analysis.generatedAt = new Date();
    analysis.analysisCompletedAt = new Date();
    analysis.errorMessage = null;
    analysis.errorDetails = null;

    await analysis.save();

    console.log(`✅ Analysis completed successfully for resume ${resumeId}`);
    console.log(`   ATS Score: ${analysis.atsScore}`);
    console.log(`   Duration: ${analysis.analysisCompletedAt - analysis.analysisStartedAt}ms\n`);

  } catch (error) {
    console.error(`❌ Analysis generation failed for resume ${resumeId}:`, error);

    // Update analysis with error
    if (analysis) {
      analysis.analysisStatus = 'failed';
      analysis.errorMessage = error.message;
      analysis.errorDetails = error.stack;
      analysis.analysisCompletedAt = new Date();
      
      try {
        await analysis.save();
        console.log(`💾 Error saved to analysis document`);
      } catch (saveError) {
        console.error(`Failed to save error to analysis:`, saveError);
      }
    }

    // Log detailed error for debugging
    console.error('🤖 AI Analysis Error Details:', {
      resumeId,
      userId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Regenerate analysis (force new generation)
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated analysis
 */
export const regenerateAnalysis = async (resumeId, userId) => {
  try {
    console.log(`🔄 Regenerating analysis for resume ${resumeId}`);

    // Find existing analysis
    const analysis = await Analysis.findByResumeId(resumeId);
    
    if (!analysis) {
      // No existing analysis, create and generate
      await createPendingAnalysis(resumeId, userId);
      await triggerAnalysisGeneration(resumeId, userId);
      return await Analysis.findByResumeId(resumeId);
    }

    // Check if can regenerate
    if (analysis.isInProgress()) {
      throw new Error('Analysis is currently processing. Please wait for it to complete.');
    }

    // Reset analysis to processing state
    analysis.analysisStatus = 'processing';
    analysis.analysisStartedAt = new Date();
    analysis.forcedRegeneration = true;
    analysis.retryCount = 0;
    analysis.errorMessage = null;
    analysis.errorDetails = null;
    
    await analysis.save();

    // Trigger async generation
    generateAnalysisAsync(resumeId, userId).catch(error => {
      console.error(`Regeneration failed:`, error);
    });

    return analysis;
  } catch (error) {
    console.error('Error regenerating analysis:', error);
    throw error;
  }
};

/**
 * Get analysis status
 * @param {string} resumeId - Resume ID
 * @returns {Promise<Object>} Analysis status
 */
export const getAnalysisStatus = async (resumeId) => {
  try {
    const analysis = await Analysis.findByResumeId(resumeId);
    
    if (!analysis) {
      return {
        exists: false,
        status: null,
      };
    }

    return {
      exists: true,
      status: analysis.analysisStatus,
      atsScore: analysis.atsScore,
      errorMessage: analysis.errorMessage,
      analysisStartedAt: analysis.analysisStartedAt,
      analysisCompletedAt: analysis.analysisCompletedAt,
      retryCount: analysis.retryCount,
    };
  } catch (error) {
    console.error('Error getting analysis status:', error);
    throw error;
  }
};

/**
 * Retry failed analysis
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Analysis document
 */
export const retryFailedAnalysis = async (resumeId, userId) => {
  try {
    const analysis = await Analysis.findByResumeId(resumeId);
    
    if (!analysis) {
      throw new Error('Analysis not found');
    }

    if (analysis.analysisStatus !== 'failed') {
      throw new Error('Can only retry failed analyses');
    }

    // Reset to processing
    analysis.analysisStatus = 'processing';
    analysis.analysisStartedAt = new Date();
    analysis.errorMessage = null;
    analysis.errorDetails = null;
    
    await analysis.save();

    // Trigger generation
    generateAnalysisAsync(resumeId, userId).catch(error => {
      console.error(`Retry failed:`, error);
    });

    return analysis;
  } catch (error) {
    console.error('Error retrying analysis:', error);
    throw error;
  }
};
