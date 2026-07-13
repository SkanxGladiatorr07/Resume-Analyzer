/**
 * AI Analysis Service
 * Business logic layer for AI-powered resume analysis
 * Uses Gemini service but keeps business logic separate
 * 
 * NOTE: Most functions in this file are prepared for future features
 * and are not currently used in the production workflow.
 * The primary analysis flow uses analysisPipeline.js instead.
 */

import * as geminiService from './geminiService.js';
import {
  generateStructuredAnalysisPrompt,
  generateATSOptimizationPrompt,
  generateSkillGapPrompt,
  generateImprovementPrompt,
  generateKeywordExtractionPrompt,
} from '../prompts/index.js';

/**
 * Perform comprehensive resume analysis
 * NOTE: Not currently used in production. Prepared for future "Advanced Analysis" feature.
 * The primary analysis uses analysisPipeline.js with structured analysis prompt.
 * @param {Object} structuredData - Parsed resume data
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeResumeComprehensive = async (structuredData) => {
  // Validate input
  if (!structuredData || typeof structuredData !== 'object') {
    throw new Error('Invalid resume data provided for analysis');
  }

  // Check if Gemini is available
  if (!geminiService.isGeminiAvailable()) {
    throw new Error('AI service is not available. Please configure Gemini API key.');
  }

  try {
    console.log('🔍 Starting comprehensive resume analysis...');

    // Generate prompt using structured analysis (primary prompt)
    const prompt = generateStructuredAnalysisPrompt(structuredData);

    // Call Gemini AI
    const result = await geminiService.analyzeResume(prompt);

    if (!result.success) {
      throw new Error(result.error || 'AI analysis failed');
    }

    console.log('✅ Comprehensive analysis completed');

    return {
      success: true,
      analysis: result.data,
      analysisType: 'comprehensive',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    throw error;
  }
};

/**
 * Analyze ATS compatibility
 * NOTE: Not currently used in production. Prepared for future "ATS Deep Dive" feature.
 * @param {Object} structuredData - Parsed resume data
 * @returns {Promise<Object>} ATS analysis results
 */
export const analyzeATSCompatibility = async (structuredData) => {
  // Validate input
  if (!structuredData || typeof structuredData !== 'object') {
    throw new Error('Invalid resume data provided for ATS analysis');
  }

  // Check if Gemini is available
  if (!geminiService.isGeminiAvailable()) {
    throw new Error('AI service is not available. Please configure Gemini API key.');
  }

  try {
    console.log('🔍 Starting ATS compatibility analysis...');

    // Generate prompt
    const prompt = generateATSOptimizationPrompt(structuredData);

    // Call Gemini AI
    const result = await geminiService.analyzeResume(prompt);

    if (!result.success) {
      throw new Error(result.error || 'ATS analysis failed');
    }

    console.log('✅ ATS analysis completed');

    return {
      success: true,
      analysis: result.data,
      analysisType: 'ats',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('ATS analysis error:', error);
    throw error;
  }
};

/**
 * Analyze skill gaps for a target role
 * NOTE: Not currently used in production. Prepared for future "Career Development" feature.
 * @param {Object} structuredData - Parsed resume data
 * @param {string} targetRole - Target job role
 * @returns {Promise<Object>} Skill gap analysis results
 */
export const analyzeSkillGaps = async (structuredData, targetRole = 'Software Engineer') => {
  // Validate input
  if (!structuredData || typeof structuredData !== 'object') {
    throw new Error('Invalid resume data provided for skill gap analysis');
  }

  // Check if Gemini is available
  if (!geminiService.isGeminiAvailable()) {
    throw new Error('AI service is not available. Please configure Gemini API key.');
  }

  try {
    console.log(`🔍 Starting skill gap analysis for role: ${targetRole}...`);

    // Generate prompt
    const prompt = generateSkillGapPrompt(structuredData, targetRole);

    // Call Gemini AI
    const result = await geminiService.analyzeResume(prompt);

    if (!result.success) {
      throw new Error(result.error || 'Skill gap analysis failed');
    }

    console.log('✅ Skill gap analysis completed');

    return {
      success: true,
      analysis: result.data,
      analysisType: 'skillGap',
      targetRole,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    throw error;
  }
};

/**
 * Generate improvement suggestions
 * NOTE: Not currently used in production. Prepared for future "Detailed Recommendations" feature.
 * @param {Object} structuredData - Parsed resume data
 * @returns {Promise<Object>} Improvement suggestions
 */
export const generateImprovements = async (structuredData) => {
  // Validate input
  if (!structuredData || typeof structuredData !== 'object') {
    throw new Error('Invalid resume data provided for improvements');
  }

  // Check if Gemini is available
  if (!geminiService.isGeminiAvailable()) {
    throw new Error('AI service is not available. Please configure Gemini API key.');
  }

  try {
    console.log('🔍 Generating improvement suggestions...');

    // Generate prompt
    const prompt = generateImprovementPrompt(structuredData);

    // Call Gemini AI
    const result = await geminiService.analyzeResume(prompt);

    if (!result.success) {
      throw new Error(result.error || 'Improvement generation failed');
    }

    console.log('✅ Improvements generated');

    return {
      success: true,
      analysis: result.data,
      analysisType: 'improvements',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Improvement generation error:', error);
    throw error;
  }
};

/**
 * Extract and analyze keywords
 * NOTE: Not currently used in production. Prepared for future "Keyword Optimization" feature.
 * @param {Object} structuredData - Parsed resume data
 * @param {string} jobDescription - Optional job description to match against
 * @returns {Promise<Object>} Keyword analysis results
 */
export const extractKeywords = async (structuredData, jobDescription = null) => {
  // Validate input
  if (!structuredData || typeof structuredData !== 'object') {
    throw new Error('Invalid resume data provided for keyword extraction');
  }

  // Check if Gemini is available
  if (!geminiService.isGeminiAvailable()) {
    throw new Error('AI service is not available. Please configure Gemini API key.');
  }

  try {
    console.log('🔍 Extracting and analyzing keywords...');

    // Generate prompt
    const prompt = generateKeywordExtractionPrompt(structuredData, jobDescription);

    // Call Gemini AI
    const result = await geminiService.analyzeResume(prompt);

    if (!result.success) {
      throw new Error(result.error || 'Keyword extraction failed');
    }

    console.log('✅ Keyword extraction completed');

    return {
      success: true,
      analysis: result.data,
      analysisType: 'keywords',
      hasJobDescription: !!jobDescription,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Keyword extraction error:', error);
    throw error;
  }
};

/**
 * Check if AI service is available
 * @returns {boolean} Whether AI is available
 */
export const isAIAvailable = () => {
  return geminiService.isGeminiAvailable();
};

/**
 * Get AI service info
 * @returns {Object} Service information
 */
export const getAIInfo = () => {
  return {
    available: geminiService.isGeminiAvailable(),
    ...geminiService.getModelInfo(),
  };
};

/**
 * Test AI connection
 * @returns {Promise<Object>} Test result
 */
export const testAIConnection = async () => {
  return await geminiService.testConnection();
};
