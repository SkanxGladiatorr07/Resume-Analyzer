/**
 * Version Controller
 * Handles HTTP requests for resume version management
 */

import {
  getResumeVersions,
  getSpecificVersion,
  compareResumeVersions,
  cleanupOldVersions,
  restoreVersion,
} from '../services/versionService.js';

/**
 * Get all versions for a resume
 * GET /api/resumes/:id/versions
 */
export const getVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { limit, skip, includeData } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit, 10);
    if (skip) options.skip = parseInt(skip, 10);
    if (includeData === 'true') options.includeData = true;

    const result = await getResumeVersions(id, userId, options);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Version Controller] Error getting versions:', error);

    const statusCode = error.message === 'Resume not found' ? 404 : error.message === 'Access denied' ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to get resume versions',
    });
  }
};

/**
 * Get a specific version
 * GET /api/resumes/:id/versions/:versionNumber
 */
export const getVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    const userId = req.user.id;

    const result = await getSpecificVersion(id, parseInt(versionNumber, 10), userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Version Controller] Error getting version:', error);

    const statusCode =
      error.message === 'Resume not found' || error.message === 'Version not found'
        ? 404
        : error.message === 'Access denied'
        ? 403
        : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to get version',
    });
  }
};

/**
 * Compare two versions
 * GET /api/resumes/:id/compare/:version1/:version2
 */
export const compareVersions = async (req, res) => {
  try {
    const { id, version1, version2 } = req.params;
    const userId = req.user.id;

    // Validate version numbers
    const v1 = parseInt(version1, 10);
    const v2 = parseInt(version2, 10);

    if (isNaN(v1) || isNaN(v2)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid version numbers',
      });
    }

    if (v1 === v2) {
      return res.status(400).json({
        success: false,
        message: 'Cannot compare a version with itself',
      });
    }

    const result = await compareResumeVersions(id, v1, v2, userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Version Controller] Error comparing versions:', error);

    const statusCode =
      error.message === 'Resume not found' || error.message.includes('not found')
        ? 404
        : error.message === 'Access denied'
        ? 403
        : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to compare versions',
    });
  }
};

/**
 * Cleanup old versions
 * DELETE /api/resumes/:id/versions/cleanup
 */
export const cleanup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { keep = 10 } = req.query;

    const keepCount = parseInt(keep, 10);

    if (isNaN(keepCount) || keepCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid keep count. Must be a positive integer.',
      });
    }

    const result = await cleanupOldVersions(id, userId, keepCount);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Version Controller] Error cleaning up versions:', error);

    const statusCode = error.message === 'Resume not found' ? 404 : error.message === 'Access denied' ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to cleanup versions',
    });
  }
};

/**
 * Restore a previous version
 * POST /api/resumes/:id/versions/:versionNumber/restore
 */
export const restore = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    const userId = req.user.id;

    const vNum = parseInt(versionNumber, 10);

    if (isNaN(vNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid version number',
      });
    }

    const result = await restoreVersion(id, vNum, userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('[Version Controller] Error restoring version:', error);

    const statusCode =
      error.message === 'Resume not found' || error.message === 'Version not found'
        ? 404
        : error.message === 'Access denied'
        ? 403
        : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to restore version',
    });
  }
};

export default {
  getVersions,
  getVersion,
  compareVersions,
  cleanup,
  restore,
};
