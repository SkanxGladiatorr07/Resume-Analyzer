/**
 * Version Middleware
 * Automatically creates version snapshots when resumes are updated
 */

import { createResumeVersion } from '../services/versionService.js';

/**
 * Create version after successful parsing or analysis
 */
export const createVersionAfterUpdate = async (resumeId, userId, data) => {
  try {
    const { parsedData, aiAnalysis, changeDescription, isAutoSave } = data;

    await createResumeVersion({
      resumeId,
      userId,
      parsedData,
      aiAnalysis,
      changeDescription: changeDescription || 'Auto-saved version',
      isAutoSave: isAutoSave !== undefined ? isAutoSave : true,
    });

    console.log(`[Version Middleware] Version created for resume ${resumeId}`);
  } catch (error) {
    // Don't fail the main operation if version creation fails
    console.error('[Version Middleware] Failed to create version:', error.message);
  }
};

export default {
  createVersionAfterUpdate,
};
