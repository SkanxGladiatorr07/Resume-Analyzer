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

    // ATS Score (0-100)
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // Overall summary
    summary: {
      type: String,
      required: true,
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
      default: Date.now,
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

// Ensure only one analysis per resume (unless regenerating)
analysisSchema.index({ resume: 1 }, { unique: true });

// Virtual for age of analysis
analysisSchema.virtual('analysisAge').get(function () {
  return Date.now() - this.generatedAt.getTime();
});

// Method to check if analysis is stale (older than 30 days)
analysisSchema.methods.isStale = function () {
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  return this.analysisAge > thirtyDaysInMs;
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
