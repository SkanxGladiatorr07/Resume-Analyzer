import mongoose from 'mongoose';

/**
 * Interview History Schema
 * Stores generated interview questions
 */
const interviewHistorySchema = new mongoose.Schema(
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
    jobDescription: {
      type: String,
      default: null,
    },
    questions: {
      technical: [
        {
          question: { type: String, required: true },
          difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
          idealAnswer: { type: String },
        },
      ],
      behavioral: [
        {
          question: { type: String, required: true },
          category: { type: String },
          idealAnswer: { type: String },
        },
      ],
      projectBased: [
        {
          question: { type: String, required: true },
          relatedProject: { type: String },
          idealAnswer: { type: String },
        },
      ],
      followUp: [
        {
          question: { type: String, required: true },
          parentQuestion: { type: String },
          idealAnswer: { type: String },
        },
      ],
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
interviewHistorySchema.index({ user: 1, resume: 1, createdAt: -1 });

/**
 * Get interview history for a resume
 */
interviewHistorySchema.statics.getResumeHistory = async function (resumeId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  return this.find({ resume: resumeId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-__v')
    .lean();
};

/**
 * Get user statistics
 */
interviewHistorySchema.statics.getUserStats = async function (userId) {
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
 * Create interview record
 */
interviewHistorySchema.statics.createInterview = async function (data) {
  const interview = new this({
    user: data.userId,
    resume: data.resumeId,
    jobDescription: data.jobDescription,
    questions: data.questions,
    metadata: data.metadata,
    status: 'completed',
  });
  return interview.save();
};

/**
 * Create error record
 */
interviewHistorySchema.statics.createErrorInterview = async function (data) {
  const interview = new this({
    user: data.userId,
    resume: data.resumeId,
    jobDescription: data.jobDescription,
    questions: {
      technical: [],
      behavioral: [],
      projectBased: [],
      followUp: [],
    },
    status: 'error',
    errorMessage: data.errorMessage,
    metadata: data.metadata || {},
  });
  return interview.save();
};

const InterviewHistory = mongoose.model('InterviewHistory', interviewHistorySchema);

export default InterviewHistory;
