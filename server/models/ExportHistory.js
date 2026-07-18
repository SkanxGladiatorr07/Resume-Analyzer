/**
 * Export History Model
 * Tracks PDF export history for analytics and auditing
 */

import mongoose from 'mongoose';

const exportHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    exportType: {
      type: String,
      enum: ['full-report', 'ats-analysis', 'job-match'],
      default: 'full-report',
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      atsScore: Number,
      includeJobMatch: Boolean,
      jobMatchCount: Number,
      generationTime: Number, // in milliseconds
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
exportHistorySchema.index({ user: 1, createdAt: -1 });
exportHistorySchema.index({ resume: 1, createdAt: -1 });
exportHistorySchema.index({ user: 1, status: 1 });

/**
 * Static method: Create export record
 */
exportHistorySchema.statics.createExport = async function (data) {
  const exportRecord = new this({
    user: data.userId,
    resume: data.resumeId,
    exportType: data.exportType || 'full-report',
    fileName: data.fileName,
    fileSize: data.fileSize,
    status: 'success',
    metadata: data.metadata || {},
  });

  return exportRecord.save();
};

/**
 * Static method: Create failed export record
 */
exportHistorySchema.statics.createFailedExport = async function (data) {
  const exportRecord = new this({
    user: data.userId,
    resume: data.resumeId,
    exportType: data.exportType || 'full-report',
    fileName: data.fileName || 'export_failed.pdf',
    status: 'failed',
    errorMessage: data.errorMessage,
    metadata: data.metadata || {},
  });

  return exportRecord.save();
};

/**
 * Static method: Get user export history
 */
exportHistorySchema.statics.getUserHistory = async function (userId, options = {}) {
  const { limit = 20, skip = 0 } = options;

  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('resume', 'originalName fileName')
    .select('-__v')
    .lean();
};

/**
 * Static method: Get resume export history
 */
exportHistorySchema.statics.getResumeHistory = async function (resumeId, options = {}) {
  const { limit = 10, skip = 0 } = options;

  return this.find({ resume: resumeId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-__v')
    .lean();
};

/**
 * Static method: Get user statistics
 */
exportHistorySchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalExports: { $sum: 1 },
        successfulExports: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
        },
        failedExports: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
        },
        totalFileSize: { $sum: '$fileSize' },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalExports: 0,
      successfulExports: 0,
      failedExports: 0,
      totalFileSize: 0,
    };
  }

  return stats[0];
};

const ExportHistory = mongoose.model('ExportHistory', exportHistorySchema);

export default ExportHistory;
