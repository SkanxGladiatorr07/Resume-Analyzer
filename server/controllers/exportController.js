/**
 * Export Controller
 * Handles HTTP requests for PDF export generation
 */

import fs from 'fs';
import {
  exportReport,
  getExportHistory,
  getExportStats,
} from '../services/exportService.js';

/**
 * Generate and download PDF report
 * POST /api/report/export
 */
export const exportPDFReport = async (req, res) => {
  try {
    const { resumeId, includeJobMatch = true } = req.body;
    const userId = req.user.id;

    // Validate resumeId
    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required',
      });
    }

    console.log(`[Export Controller] Generating PDF for resume ${resumeId}`);

    // Generate PDF
    const result = await exportReport({
      resumeId,
      userId,
      includeJobMatch,
    });

    // Check if file exists
    if (!fs.existsSync(result.data.filePath)) {
      return res.status(500).json({
        success: false,
        message: 'PDF generation succeeded but file not found',
      });
    }

    console.log(`[Export Controller] PDF generated successfully: ${result.data.fileName}`);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.fileName}"`);
    res.setHeader('Content-Length', result.data.fileSize);
    res.setHeader('X-Generation-Time', result.data.generationTime);

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(result.data.filePath);

    fileStream.on('error', (error) => {
      console.error('[Export Controller] Error reading file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error reading generated PDF file',
        });
      }
    });

    fileStream.pipe(res);

    // Optional: Delete file after sending (or implement cleanup job)
    fileStream.on('end', () => {
      console.log(`[Export Controller] File sent successfully: ${result.data.fileName}`);
      // Uncomment to delete file immediately after download
      // fs.unlinkSync(result.data.filePath);
    });
  } catch (error) {
    console.error('[Export Controller] Error exporting PDF:', error);

    const statusCode =
      error.message === 'Resume not found'
        ? 404
        : error.message === 'Access denied'
        ? 403
        : error.message.includes('No analysis found') || error.message.includes('not completed')
        ? 400
        : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to export PDF report',
    });
  }
};

/**
 * Get export history for authenticated user
 * GET /api/report/export/history
 */
export const getUserExportHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, skip } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit, 10);
    if (skip) options.skip = parseInt(skip, 10);

    const result = await getExportHistory(userId, options);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Export Controller] Error getting export history:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get export history',
    });
  }
};

/**
 * Get export statistics for authenticated user
 * GET /api/report/export/stats
 */
export const getUserExportStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getExportStats(userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Export Controller] Error getting export stats:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get export statistics',
    });
  }
};

export default {
  exportPDFReport,
  getUserExportHistory,
  getUserExportStats,
};
