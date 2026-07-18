import mongoose from 'mongoose';

/**
 * Project History Schema
 * Stores generated project suggestions
 */
const projectHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    existingSkills: [String],
    missingSkills: [String],
    careerGoal: String,
    projects: [
      {
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        difficulty: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced'],
          required: true,
        },
        technologies: [String],
        learningOutcomes: [String],
        estimatedDuration: {
          type: String,
          required: true,
        },
        keyFeatures: [String],
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

// Indexes
projectHistorySchema.index({ user: 1, createdAt: -1 });

/**
 * Get user history
 */
projectHistorySchema.statics.getUserHistory = async function (userId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-__v')
    .lean();
};

/**
 * Get user statistics
 */
projectHistorySchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalGenerated: { $sum: 1 },
        averageResponseTime: { $avg: '$metadata.responseTime' },
      },
    },
  ]);

  if (stats.length === 0) {
    return { totalGenerated: 0, averageResponseTime: 0 };
  }

  return stats[0];
};

/**
 * Create project record
 */
projectHistorySchema.statics.createProject = async function (data) {
  const project = new this({
    user: data.userId,
    existingSkills: data.existingSkills,
    missingSkills: data.missingSkills,
    careerGoal: data.careerGoal,
    projects: data.projects,
    metadata: data.metadata,
    status: 'completed',
  });
  return project.save();
};

/**
 * Create error record
 */
projectHistorySchema.statics.createErrorProject = async function (data) {
  const project = new this({
    user: data.userId,
    existingSkills: data.existingSkills,
    missingSkills: data.missingSkills,
    careerGoal: data.careerGoal,
    projects: [],
    status: 'error',
    errorMessage: data.errorMessage,
    metadata: data.metadata || {},
  });
  return project.save();
};

const ProjectHistory = mongoose.model('ProjectHistory', projectHistorySchema);

export default ProjectHistory;
