import mongoose from 'mongoose';

/**
 * Rewrite History Schema
 * Stores the history of AI resume rewrites
 */
const rewriteHistorySchema = new mongoose.Schema(
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
    section: {
      type: String,
      required: true,
      enum: ['summary', 'experience', 'projects', 'skills'],
      index: true,
    },
    tone: {
      type: String,
      required: true,
      enum: ['professional', 'technical', 'leadership', 'concise'],
    },
    originalContent: {
      type: String,
      required: true,
    },
    rewrittenContent: {
      type: String,
      required: true,
    },
    improvements: [
      {
        type: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
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
rewriteHistorySchema.index({ user: 1, resume: 1, createdAt: -1 });
rewriteHistorySchema.index({ user: 1, section: 1, createdAt: -1 });

/**
 * Get rewrite history for a resume
 * @param {string} resumeId - Resume ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Rewrite history
 */
rewriteHistorySchema.statics.getResumeHistory = async function (resumeId, options = {}) {
  const { section, limit = 20, skip = 0 } = options;

  const query = { resume: resumeId };
  if (section) {
    query.section = section;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-__v')
    .lean();
};

/**
 * Get rewrite history for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Rewrite history
 */
rewriteHistorySchema.statics.getUserHistory = async function (userId, options = {}) {
  const { section, limit = 20, skip = 0 } = options;

  const query = { user: userId };
  if (section) {
    query.section = section;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('resume', 'fileName originalName')
    .select('-__v')
    .lean();
};

/**
 * Get rewrite statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Statistics
 */
rewriteHistorySchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalRewrites: { $sum: 1 },
        sectionsRewritten: { $addToSet: '$section' },
        tonesUsed: { $addToSet: '$tone' },
        averageResponseTime: { $avg: '$metadata.responseTime' },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalRewrites: 0,
      sectionsRewritten: [],
      tonesUsed: [],
      averageResponseTime: 0,
    };
  }

  return stats[0];
};

/**
 * Create a rewrite record
 * @param {Object} data - Rewrite data
 * @returns {Promise<Object>} Created rewrite
 */
rewriteHistorySchema.statics.createRewrite = async function (data) {
  const rewrite = new this({
    user: data.userId,
    resume: data.resumeId,
    section: data.section,
    tone: data.tone,
    originalContent: data.originalContent,
    rewrittenContent: data.rewrittenContent,
    improvements: data.improvements,
    metadata: data.metadata,
    status: 'completed',
  });

  return rewrite.save();
};

/**
 * Mark rewrite as error
 * @param {Object} data - Error data
 * @returns {Promise<Object>} Created error record
 */
rewriteHistorySchema.statics.createErrorRewrite = async function (data) {
  const rewrite = new this({
    user: data.userId,
    resume: data.resumeId,
    section: data.section,
    tone: data.tone,
    originalContent: data.originalContent,
    rewrittenContent: '',
    improvements: [],
    status: 'error',
    errorMessage: data.errorMessage,
    metadata: data.metadata || {},
  });

  return rewrite.save();
};

const RewriteHistory = mongoose.model('RewriteHistory', rewriteHistorySchema);

export default RewriteHistory;
