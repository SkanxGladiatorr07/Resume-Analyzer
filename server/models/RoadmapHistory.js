import mongoose from 'mongoose';

/**
 * Roadmap History Schema
 * Stores generated learning and career roadmaps
 */
const roadmapHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['learning', 'career'],
      required: true,
    },
    // Learning roadmap fields
    currentSkills: [String],
    targetRole: String,
    timeframe: String,
    // Career roadmap fields
    currentRole: String,
    targetCareerRole: String,
    yearsOfExperience: Number,
    // Roadmap data
    roadmap: {
      overview: String,
      phases: [
        {
          phase: String,
          duration: String,
          topics: [String],
          resources: [
            {
              title: String,
              type: String, // course, book, article, video, project
              url: String,
              description: String,
            },
          ],
          milestones: [String],
        },
      ],
      estimatedTimeline: String,
      keyMilestones: [String],
      recommendations: [String],
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

// Indexes
roadmapHistorySchema.index({ user: 1, type: 1, createdAt: -1 });

/**
 * Get user history by type
 */
roadmapHistorySchema.statics.getUserHistory = async function (userId, type, options = {}) {
  const { limit = 20, skip = 0 } = options;
  const query = { user: userId };
  if (type) query.type = type;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-__v')
    .lean();
};

/**
 * Get user statistics
 */
roadmapHistorySchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    totalGenerated: 0,
    learningRoadmaps: 0,
    careerRoadmaps: 0,
  };

  stats.forEach((stat) => {
    result.totalGenerated += stat.count;
    if (stat._id === 'learning') result.learningRoadmaps = stat.count;
    if (stat._id === 'career') result.careerRoadmaps = stat.count;
  });

  return result;
};

/**
 * Create roadmap record
 */
roadmapHistorySchema.statics.createRoadmap = async function (data) {
  const roadmap = new this({
    user: data.userId,
    type: data.type,
    currentSkills: data.currentSkills,
    targetRole: data.targetRole,
    timeframe: data.timeframe,
    currentRole: data.currentRole,
    targetCareerRole: data.targetCareerRole,
    yearsOfExperience: data.yearsOfExperience,
    roadmap: data.roadmap,
    metadata: data.metadata,
    status: 'completed',
  });
  return roadmap.save();
};

/**
 * Create error record
 */
roadmapHistorySchema.statics.createErrorRoadmap = async function (data) {
  const roadmap = new this({
    user: data.userId,
    type: data.type,
    currentSkills: data.currentSkills,
    targetRole: data.targetRole,
    timeframe: data.timeframe,
    currentRole: data.currentRole,
    targetCareerRole: data.targetCareerRole,
    yearsOfExperience: data.yearsOfExperience,
    roadmap: {
      overview: '',
      phases: [],
      estimatedTimeline: '',
      keyMilestones: [],
      recommendations: [],
    },
    status: 'error',
    errorMessage: data.errorMessage,
    metadata: data.metadata || {},
  });
  return roadmap.save();
};

const RoadmapHistory = mongoose.model('RoadmapHistory', roadmapHistorySchema);

export default RoadmapHistory;
