/**
 * Version Service
 * Handles resume version management
 */

import ResumeVersion from '../models/ResumeVersion.js';
import Resume from '../models/Resume.js';
import { compareVersions } from './versionComparisonService.js';

/**
 * Create a new resume version
 */
export const createResumeVersion = async ({
  resumeId,
  userId,
  fileName,
  fileSize,
  parsedData,
  aiAnalysis,
  changeDescription,
  isAutoSave = false,
}) => {
  const logPrefix = '[Version Service]';

  try {
    console.log(`${logPrefix} Creating new version for resume ${resumeId}`);

    // Verify resume exists and belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied');
    }

    // Create version
    const version = await ResumeVersion.createVersion({
      resumeId,
      userId,
      fileName: fileName || resume.fileName,
      fileSize: fileSize || resume.fileSize,
      parsedData,
      aiAnalysis,
      changeDescription,
      isAutoSave,
    });

    console.log(`${logPrefix} Version ${version.versionNumber} created successfully`);

    return {
      success: true,
      data: {
        versionNumber: version.versionNumber,
        versionId: version._id,
        createdAt: version.createdAt,
      },
    };
  } catch (error) {
    console.error(`${logPrefix} Error creating version:`, error.message);
    throw error;
  }
};

/**
 * Get all versions for a resume
 */
export const getResumeVersions = async (resumeId, userId, options = {}) => {
  const logPrefix = '[Version Service]';

  try {
    console.log(`${logPrefix} Fetching versions for resume ${resumeId}`);

    // Verify resume exists and belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied');
    }

    // Get versions
    const versions = await ResumeVersion.getResumeVersions(resumeId, options);
    const totalCount = await ResumeVersion.getVersionCount(resumeId);

    console.log(`${logPrefix} Found ${versions.length} versions`);

    return {
      success: true,
      data: {
        versions,
        total: totalCount,
        resumeId,
      },
    };
  } catch (error) {
    console.error(`${logPrefix} Error fetching versions:`, error.message);
    throw error;
  }
};

/**
 * Get a specific version
 */
export const getSpecificVersion = async (resumeId, versionNumber, userId) => {
  const logPrefix = '[Version Service]';

  try {
    console.log(`${logPrefix} Fetching version ${versionNumber} for resume ${resumeId}`);

    // Verify resume exists and belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied');
    }

    // Get version
    const version = await ResumeVersion.getVersion(resumeId, versionNumber);
    if (!version) {
      throw new Error('Version not found');
    }

    return {
      success: true,
      data: version,
    };
  } catch (error) {
    console.error(`${logPrefix} Error fetching version:`, error.message);
    throw error;
  }
};

/**
 * Compare two versions
 */
export const compareResumeVersions = async (resumeId, version1, version2, userId) => {
  const logPrefix = '[Version Service]';

  try {
    console.log(`${logPrefix} Comparing versions ${version1} and ${version2} for resume ${resumeId}`);

    // Verify resume exists and belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied');
    }

    // Get versions for comparison
    const { olderVersion, newerVersion } = await ResumeVersion.getVersionsForComparison(
      resumeId,
      version1,
      version2
    );

    // Perform comparison
    const comparisonResult = await compareVersions(olderVersion, newerVersion);

    console.log(`${logPrefix} Comparison completed successfully`);

    return comparisonResult;
  } catch (error) {
    console.error(`${logPrefix} Error comparing versions:`, error.message);
    throw error;
  }
};

/**
 * Delete old versions (cleanup)
 */
export const cleanupOldVersions = async (resumeId, userId, keepCount = 10) => {
  const logPrefix = '[Version Service]';

  try {
    console.log(`${logPrefix} Cleaning up old versions for resume ${resumeId}, keeping ${keepCount}`);

    // Verify resume exists and belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied');
    }

    const deletedCount = await ResumeVersion.cleanupOldVersions(resumeId, keepCount);

    console.log(`${logPrefix} Deleted ${deletedCount} old versions`);

    return {
      success: true,
      data: {
        deletedCount,
        kept: keepCount,
      },
    };
  } catch (error) {
    console.error(`${logPrefix} Error cleaning up versions:`, error.message);
    throw error;
  }
};

/**
 * Restore a previous version as current
 */
export const restoreVersion = async (resumeId, versionNumber, userId) => {
  const logPrefix = '[Version Service]';

  try {
    console.log(`${logPrefix} Restoring version ${versionNumber} for resume ${resumeId}`);

    // Verify resume exists and belongs to user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied');
    }

    // Get version to restore
    const version = await ResumeVersion.getVersion(resumeId, versionNumber);
    if (!version) {
      throw new Error('Version not found');
    }

    // Update resume with version data
    resume.parsedData = version.parsedData;
    resume.fileName = version.fileName;
    resume.fileSize = version.fileSize;
    await resume.save();

    // Create new version for the restore action
    await createResumeVersion({
      resumeId,
      userId,
      fileName: version.fileName,
      fileSize: version.fileSize,
      parsedData: version.parsedData,
      aiAnalysis: version.aiAnalysis,
      changeDescription: `Restored from version ${versionNumber}`,
      isAutoSave: false,
    });

    console.log(`${logPrefix} Version ${versionNumber} restored successfully`);

    return {
      success: true,
      data: {
        message: `Version ${versionNumber} restored successfully`,
        restoredFrom: versionNumber,
      },
    };
  } catch (error) {
    console.error(`${logPrefix} Error restoring version:`, error.message);
    throw error;
  }
};

export default {
  createResumeVersion,
  getResumeVersions,
  getSpecificVersion,
  compareResumeVersions,
  cleanupOldVersions,
  restoreVersion,
};
