/**
 * JobMatch Model
 * Stores AI-generated resume-to-job comparison results
 */

import mongoose from 'mongoose';

const jobMatchSchema = new mongoose.Schema(
  {
    // Reference to the resume
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    
    // Reference to the job description
    jobDescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: true,
      index: true,
    },
    
    // Reference to the user (for easier queries)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Match Status
    matchStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },

    // Match Score (0-100)
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // Overall summary
    summary: {
      type: String,
      trim: true,
      default: null,
    },

    // Matching skills
    matchingSkills: {
      type: [String],
      default: [],
    },

    // Missing technical skills
    missingTechnicalSkills: {
      type: [String],
      default: [],
    },

    // Missing soft skills
    missingSoftSkills: {
      type: [String],
      default: [],
    },

    // Missing keywords
    missingKeywords: {
      type: [String],
      default: [],
    },

    // Strengths
    strengths: {
      type: [String],
      default: [],
    },

    // Recommendations
    recommendations: {
      type: [String],
      default: [],
    },

    // ATS optimization tips
    atsOptimizationTips: {
      type: [String],
      default: [],
    },

    // Confidence score (quality of analysis)
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // Error information (if failed)
    errorMessage: {
      type: String,
      default: null,
    },

    errorDetails: {
      type: String,
      default: null,
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    // Metadata
    matchVersion: {
      type: String,
      default: '1.0',
    },

    // AI model used
    aiModel: {
      type: String,
      default: 'gemini-1.5-flash',
    },

    // Generation timestamp
    generatedAt: {
      type: Date,
      default: null,
    },

    // Match started timestamp
    matchStartedAt: {
      type: Date,
      default: null,
    },

    // Match completed timestamp
    matchCompletedAt: {
      type: Date,
      default: null,
    },

    // Whether this was a forced regeneration
    forcedRegeneration: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
jobMatchSchema.index({ resume: 1, jobDescription: 1 });
jobMatchSchema.index({ user: 1, createdAt: -1 });
jobMatchSchema.index({ matchStatus: 1 });

// Virtual for match age
jobMatchSchema.virtual('matchAge').get(function () {
  if (!this.generatedAt) return null;
  return Date.now() - this.generatedAt.getTime();
});

// Method to check if match is stale (older than 30 days)
jobMatchSchema.methods.isStale = function () {
  if (!this.generatedAt) return true;
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  return this.matchAge > thirtyDaysInMs;
};

// Method to check if match is in progress
jobMatchSchema.methods.isInProgress = function () {
  return this.matchStatus === 'processing';
};

// Method to check if match can be regenerated
jobMatchSchema.methods.canRegenerate = function () {
  return ['completed', 'failed'].includes(this.matchStatus);
};

// Static method to find match by resume and job description
jobMatchSchema.statics.findByResumeAndJob = function (resumeId, jobDescriptionId) {
  return this.findOne({ resume: resumeId, jobDescription: jobDescriptionId });
};

// Static method to find all matches for a resume
jobMatchSchema.statics.findByResume = function (resumeId) {
  return this.find({ resume: resumeId }).sort({ createdAt: -1 });
};

// Static method to find all matches for a job description
jobMatchSchema.statics.findByJobDescription = function (jobDescriptionId) {
  return this.find({ jobDescription: jobDescriptionId }).sort({ createdAt: -1 });
};

// Static method to find all matches for a user
jobMatchSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Ensure virtuals are included in JSON output
jobMatchSchema.set('toJSON', { 
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

jobMatchSchema.set('toObject', { virtuals: true });

const JobMatch = mongoose.model('JobMatch', jobMatchSchema);

export default JobMatch;
