import mongoose from 'mongoose';

/**
 * STAR History Schema
 * Stores the history of STAR bullet point generations
 */
const starHistorySchema = new mongoose.Schema(
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
    original: {
      type: String,
      required: true,
    },
    starVersion: {
      type: String,
      required: true,
    },
    breakdown: {
      situation: {
        type: String,
        required: true,
      },
      task: {
        type: String,
        required: true,
      },
      action: {
        type: String,
        required: true,
      },
      result: {
        type: String,
        required: true,
      },
    },
    metadata: {
      model: {
        type: String,
        default: 'gemini-1.5-flash',
      },
      tokensUsed: {
        type: Number,
        default: 0,
      },
      responseTime: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ['completed', 'error'],
      default: 'completed',
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
starHistorySchema.index({ user: 1, resume: 1, createdAt: -1 });
starHistorySchema.index({ user: 1, createdAt: -1 });

/**
 * Get STAR history for a resume
 * @param {string} resumeId - Resume ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} STAR history
 */
starHistorySchema.statics.getResumeHistory = async function (resumeId, options = {}) {
  const { limit = 20, skip = 0 } = options;

  return this.find({ resume: resumeId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-__v')
    .lean();
};

/**
 * Get STAR history for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} STAR history
 */
starHistorySchema.statics.getUserHistory = async function (userId, options = {}) {
  const { limit = 20, skip = 0 } = options;

  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('resume', 'fileName originalName')
    .select('-__v')
    .lean();
};

/**
 * Get STAR statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Statistics
 */
starHistorySchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalGenerated: { $sum: 1 },
        averageOriginalLength: { $avg: { $strLenCP: '$original' } },
        averageStarLength: { $avg: { $strLenCP: '$starVersion' } },
        averageResponseTime: { $avg: '$metadata.responseTime' },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalGenerated: 0,
      averageOriginalLength: 0,
      averageStarLength: 0,
      averageResponseTime: 0,
    };
  }

  return {
    totalGenerated: stats[0].totalGenerated,
    averageOriginalLength: Math.round(stats[0].averageOriginalLength),
    averageStarLength: Math.round(stats[0].averageStarLength),
    averageResponseTime: Math.round(stats[0].averageResponseTime),
  };
};

/**
 * Create a STAR record
 * @param {Object} data - STAR data
 * @returns {Promise<Object>} Created STAR record
 */
starHistorySchema.statics.createStar = async function (data) {
  const star = new this({
    user: data.userId,
    resume: data.resumeId,
    original: data.original,
    starVersion: data.starVersion,
    breakdown: data.breakdown,
    metadata: data.metadata,
    status: 'completed',
  });

  return star.save();
};

/**
 * Mark STAR generation as error
 * @param {Object} data - Error data
 * @returns {Promise<Object>} Created error record
 */
starHistorySchema.statics.createErrorStar = async function (data) {
  const star = new this({
    user: data.userId,
    resume: data.resumeId,
    original: data.original,
    starVersion: '',
    breakdown: {
      situation: '',
      task: '',
      action: '',
      result: '',
    },
    status: 'error',
    errorMessage: data.errorMessage,
    metadata: data.metadata || {},
  });

  return star.save();
};

const StarHistory = mongoose.model('StarHistory', starHistorySchema);

export default StarHistory;
