/**
 * Analysis Model
 * Stores AI-generated resume analysis results
 */

import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    // Reference to the resume
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
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

    // Analysis Status
    analysisStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },

    // ATS Score (0-100)
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Overall summary
    summary: {
      type: String,
      trim: true,
    },

    // Strengths array
    strengths: {
      type: [String],
      default: [],
    },

    // Weaknesses array
    weaknesses: {
      type: [String],
      default: [],
    },

    // Missing skills array
    missingSkills: {
      type: [String],
      default: [],
    },

    // Grammar feedback array
    grammarFeedback: {
      type: [String],
      default: [],
    },

    // Formatting feedback array
    formattingFeedback: {
      type: [String],
      default: [],
    },

    // Suggestions array
    suggestions: {
      type: [String],
      default: [],
    },

    // Confidence score (0-100) for analysis quality
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Error information (if failed)
    errorMessage: {
      type: String,
    },

    errorDetails: {
      type: String,
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    // Metadata
    analysisVersion: {
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
    },

    // Analysis started timestamp
    analysisStartedAt: {
      type: Date,
    },

    // Analysis completed timestamp
    analysisCompletedAt: {
      type: Date,
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

// Compound index for efficient queries
analysisSchema.index({ resume: 1, user: 1 });

// Index on status for filtering
analysisSchema.index({ analysisStatus: 1 });

// Ensure only one analysis per resume
// NOTE: We can't use unique index here because we need to create pending entries
// Instead, we handle uniqueness in the application logic

// Virtual for age of analysis
analysisSchema.virtual('analysisAge').get(function () {
  return Date.now() - this.generatedAt.getTime();
});

// Method to check if analysis is stale (older than 30 days)
analysisSchema.methods.isStale = function () {
  if (!this.generatedAt) return true;
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  return this.analysisAge > thirtyDaysInMs;
};

// Method to check if analysis is in progress
analysisSchema.methods.isInProgress = function () {
  return this.analysisStatus === 'processing';
};

// Method to check if analysis can be regenerated
analysisSchema.methods.canRegenerate = function () {
  return ['completed', 'failed'].includes(this.analysisStatus);
};

// Static method to find analysis by resume ID
analysisSchema.statics.findByResumeId = function (resumeId) {
  return this.findOne({ resume: resumeId });
};

// Static method to delete old analysis
analysisSchema.statics.deleteByResumeId = function (resumeId) {
  return this.deleteOne({ resume: resumeId });
};

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;
