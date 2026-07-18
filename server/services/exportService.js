/**
 * Export Service
 * Handles PDF export generation and management
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Resume from '../models/Resume.js';
import Analysis from '../models/Analysis.js';
import JobMatch from '../models/JobMatch.js';
import ExportHistory from '../models/ExportHistory.js';
import { generatePDFReport } from './pdfExportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensure exports directory exists
 */
const ensureExportsDir = () => {
  const exportsDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  return exportsDir;
};

/**
 * Generate export filename
 */
const generateFileName = (resumeName, userId) => {
  const timestamp = Date.now();
  const sanitizedName = resumeName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9]/g, '_') // Replace special chars
    .substring(0, 50); // Limit length
  
  return `ResumeAI_Report_${sanitizedName}_${timestamp}.pdf`;
};

/**
 * Export resume analysis report
 */
export const exportReport = async ({ resumeId, userId, includeJobMatch = true }) => {
  const startTime = Date.now();
  const logPrefix = '[Export Service]';

  try {
    console.log(`${logPrefix} Starting export for resume ${resumeId}`);

    // Step 1: Verify resume exists and belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied');
    }

    console.log(`${logPrefix} Resume verified: ${resume.originalName}`);

    // Step 2: Get AI analysis
    const analysis = await Analysis.findOne({ resume: resumeId })
      .sort({ createdAt: -1 })
      .lean();

    if (!analysis) {
      throw new Error('No analysis found for this resume. Please analyze the resume first.');
    }

    if (analysis.analysisStatus !== 'completed') {
      throw new Error('Analysis is not completed yet. Please wait for analysis to finish.');
    }

    console.log(`${logPrefix} Analysis found: ATS Score ${analysis.atsScore}`);

    // Step 3: Get job matches (if requested)
    let jobMatches = [];
    if (includeJobMatch) {
      jobMatches = await JobMatch.find({ resume: resumeId })
        .sort({ matchScore: -1 })
        .limit(5)
        .populate('jobDescription', 'title company')
        .lean();

      // Transform job matches for PDF
      jobMatches = jobMatches.map(match => ({
        jobTitle: match.jobDescription?.title || 'N/A',
        company: match.jobDescription?.company || 'N/A',
        matchScore: match.matchScore,
        matchingSkills: match.matchingSkills || [],
        missingSkills: match.missingSkills || [],
      }));

      console.log(`${logPrefix} Found ${jobMatches.length} job matches`);
    }

    // Step 4: Get user info
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId).select('name email').lean();

    // Step 5: Prepare export directory and filename
    const exportsDir = ensureExportsDir();
    const fileName = generateFileName(resume.originalName, userId);
    const filePath = path.join(exportsDir, fileName);

    console.log(`${logPrefix} Generating PDF: ${fileName}`);

    // Step 6: Generate PDF
    const pdfData = {
      resume: {
        _id: resume._id,
        originalName: resume.originalName,
        fileName: resume.fileName,
      },
      analysis: {
        atsScore: analysis.atsScore,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missingSkills: analysis.missingSkills,
        suggestions: analysis.suggestions,
      },
      jobMatches,
      user: {
        name: user?.name || 'User',
        email: user?.email || '',
      },
      includeJobMatch,
    };

    const pdfResult = await generatePDFReport(pdfData, filePath);

    const generationTime = Date.now() - startTime;

    console.log(`${logPrefix} PDF generated successfully in ${generationTime}ms`);
    console.log(`${logPrefix} File size: ${(pdfResult.fileSize / 1024).toFixed(2)} KB`);

    // Step 7: Save export history
    await ExportHistory.createExport({
      userId,
      resumeId,
      exportType: 'full-report',
      fileName,
      fileSize: pdfResult.fileSize,
      metadata: {
        atsScore: analysis.atsScore,
        includeJobMatch,
        jobMatchCount: jobMatches.length,
        generationTime,
      },
    });

    console.log(`${logPrefix} Export history saved`);

    return {
      success: true,
      data: {
        fileName,
        filePath,
        fileSize: pdfResult.fileSize,
        generationTime,
      },
    };
  } catch (error) {
    const generationTime = Date.now() - startTime;
    console.error(`${logPrefix} Export failed:`, error.message);

    // Save failed export to history
    try {
      await ExportHistory.createFailedExport({
        userId,
        resumeId,
        exportType: 'full-report',
        fileName: 'export_failed.pdf',
        errorMessage: error.message,
        metadata: {
          generationTime,
        },
      });
    } catch (historyError) {
      console.error(`${logPrefix} Failed to save error history:`, historyError.message);
    }

    throw error;
  }
};

/**
 * Get export history for user
 */
export const getExportHistory = async (userId, options = {}) => {
  try {
    const history = await ExportHistory.getUserHistory(userId, options);

    return {
      success: true,
      data: {
        history,
        total: history.length,
      },
    };
  } catch (error) {
    console.error('[Export Service] Error getting history:', error.message);
    throw error;
  }
};

/**
 * Get export statistics for user
 */
export const getExportStats = async (userId) => {
  try {
    const stats = await ExportHistory.getUserStats(userId);

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('[Export Service] Error getting stats:', error.message);
    throw error;
  }
};

/**
 * Delete old exports (cleanup)
 */
export const cleanupOldExports = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Get old export records
    const oldExports = await ExportHistory.find({
      createdAt: { $lt: cutoffDate },
      status: 'success',
    }).select('fileName');

    const exportsDir = ensureExportsDir();
    let deletedFiles = 0;

    // Delete physical files
    for (const exportRecord of oldExports) {
      const filePath = path.join(exportsDir, exportRecord.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedFiles++;
      }
    }

    // Delete database records
    const result = await ExportHistory.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(`[Export Service] Cleanup: Deleted ${deletedFiles} files and ${result.deletedCount} records`);

    return {
      success: true,
      data: {
        deletedFiles,
        deletedRecords: result.deletedCount,
      },
    };
  } catch (error) {
    console.error('[Export Service] Cleanup error:', error.message);
    throw error;
  }
};

export default {
  exportReport,
  getExportHistory,
  getExportStats,
  cleanupOldExports,
};
