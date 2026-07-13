/**
 * Parsing Pipeline Service
 * Orchestrates the resume parsing process with proper error handling and status tracking
 */

import Resume from '../models/Resume.js';
import * as resumeParserService from './resumeParserService.js';
import * as resumeStructuredParser from './resumeStructuredParser.js';
import { validateStructuredData } from '../utils/dataValidator.js';
import { calculateConfidence } from '../utils/parserUtils.js';
import * as analysisPipeline from './analysisPipeline.js';

/**
 * Start parsing process for a resume
 * @param {string} resumeId - Resume document ID
 */
export const startParsing = async (resumeId) => {
  const resume = await Resume.findById(resumeId);

  if (!resume) {
    throw new Error('Resume not found');
  }

  // Prevent duplicate parsing
  if (resume.parsingStatus === 'processing') {
    console.log(`⚠️  Resume ${resumeId} is already being processed. Skipping.`);
    return;
  }

  // Prevent re-parsing completed resumes
  if (resume.parsingStatus === 'completed') {
    console.log(`⚠️  Resume ${resumeId} already parsed successfully. Skipping.`);
    return;
  }

  // Update status to processing
  resume.parsingStatus = 'processing';
  resume.parsingStartedAt = new Date();
  resume.parsingError = null;
  await resume.save();

  console.log(`🔄 Starting parsing for resume: ${resume.originalName} (ID: ${resumeId})`);

  try {
    // Step 1: Validate file
    console.log(`  ↳ Validating file...`);
    const isValid = await resumeParserService.validateParseableFile(
      resume.filePath,
      resume.fileType
    );

    if (!isValid) {
      throw new Error('File is corrupted, too small, or unreadable');
    }

    // Step 2: Extract text
    console.log(`  ↳ Extracting text from ${resume.fileType.toUpperCase()}...`);
    const extractedText = await resumeParserService.parseResume(
      resume.filePath,
      resume.fileType
    );

    // Step 3: Validate extraction
    console.log(`  ↳ Validating extracted text...`);
    const isSuccess = resumeParserService.isParsingSuccessful(extractedText);

    if (!isSuccess) {
      throw new Error('Extracted text is too short or empty. The file may be corrupted or contain only images.');
    }

    // Step 4: Calculate word count
    const wordCount = resumeParserService.getWordCount(extractedText);
    console.log(`  ↳ Extracted ${wordCount} words`);

    // Step 5: Parse structured data
    console.log(`  ↳ Parsing structured data...`);
    const rawStructuredData = resumeStructuredParser.parseStructuredData(extractedText);

    // Step 6: Validate and sanitize structured data
    console.log(`  ↳ Validating structured data...`);
    const structuredData = validateStructuredData(rawStructuredData);
    
    // Step 7: Calculate confidence score
    const confidenceScore = calculateConfidence(structuredData);
    console.log(`  ↳ Confidence score: ${confidenceScore}%`);

    // Step 8: Update resume with all parsed data
    resume.extractedText = extractedText;
    resume.wordCount = wordCount;
    resume.structuredData = structuredData;
    resume.parsingStatus = 'completed';
    resume.parsingCompletedAt = new Date();
    resume.parsingError = null;
    await resume.save();

    const duration = resume.parsingCompletedAt - resume.parsingStartedAt;
    console.log(`✅ Successfully parsed resume: ${resume.originalName}`);
    console.log(`   • Words: ${wordCount}`);
    console.log(`   • Confidence: ${confidenceScore}%`);
    console.log(`   • Duration: ${duration}ms`);

    // Step 9: Trigger AI analysis generation (async, non-blocking)
    console.log(`🚀 Triggering AI analysis generation...`);
    try {
      await analysisPipeline.createPendingAnalysis(resume._id, resume.user);
      analysisPipeline.triggerAnalysisGeneration(resume._id, resume.user);
      console.log(`   ✓ Analysis generation triggered`);
    } catch (analysisError) {
      console.error(`   ⚠️  Failed to trigger analysis:`, analysisError.message);
      // Don't fail the parsing if analysis triggering fails
    }

    return {
      success: true,
      resumeId: resume._id,
      wordCount,
      confidenceScore,
    };

  } catch (error) {
    console.error(`❌ Error parsing resume ${resume.originalName}:`, error.message);

    // Update resume with error status
    resume.parsingStatus = 'failed';
    resume.parsingCompletedAt = new Date();
    resume.parsingError = error.message;
    await resume.save();

    // Log for debugging
    logParsingError(resume, error);

    return {
      success: false,
      resumeId: resume._id,
      error: error.message,
    };
  }
};

/**
 * Retry parsing for a failed resume
 * @param {string} resumeId - Resume document ID
 */
export const retryParsing = async (resumeId) => {
  const resume = await Resume.findById(resumeId);

  if (!resume) {
    throw new Error('Resume not found');
  }

  if (resume.parsingStatus !== 'failed') {
    throw new Error('Can only retry failed parsing jobs');
  }

  console.log(`🔄 Retrying parsing for resume: ${resume.originalName}`);

  // Reset status to pending
  resume.parsingStatus = 'pending';
  resume.parsingError = null;
  resume.parsingStartedAt = null;
  resume.parsingCompletedAt = null;
  await resume.save();

  // Start parsing
  return await startParsing(resumeId);
};

/**
 * Get parsing status for a resume
 * @param {string} resumeId - Resume document ID
 */
export const getParsingStatus = async (resumeId) => {
  const resume = await Resume.findById(resumeId).select(
    'parsingStatus parsingError parsingStartedAt parsingCompletedAt wordCount'
  );

  if (!resume) {
    throw new Error('Resume not found');
  }

  const status = {
    status: resume.parsingStatus,
    error: resume.parsingError,
    startedAt: resume.parsingStartedAt,
    completedAt: resume.parsingCompletedAt,
    wordCount: resume.wordCount,
  };

  // Calculate duration if completed
  if (resume.parsingStartedAt && resume.parsingCompletedAt) {
    status.duration = resume.parsingCompletedAt - resume.parsingStartedAt;
  }

  return status;
};

/**
 * Log parsing error for debugging
 * @param {Object} resume - Resume document
 * @param {Error} error - Error object
 */
const logParsingError = (resume, error) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    resumeId: resume._id,
    fileName: resume.originalName,
    fileType: resume.fileType,
    fileSize: resume.fileSize,
    error: error.message,
    stack: error.stack,
  };

  // Log to console (in production, you'd log to a file or service)
  console.error('=== PARSING ERROR LOG ===');
  console.error(JSON.stringify(errorLog, null, 2));
  console.error('========================');
};

/**
 * Check if parsing is needed for a resume
 * @param {Object} resume - Resume document
 * @returns {boolean}
 */
export const needsParsing = (resume) => {
  return (
    resume.parsingStatus === 'pending' ||
    resume.parsingStatus === 'failed'
  );
};

/**
 * Get parsing statistics
 * @param {string} userId - User ID
 */
export const getParsingStats = async (userId) => {
  const stats = await Resume.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$parsingStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  stats.forEach((stat) => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};
