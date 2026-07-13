/**
 * JobDescription Model
 * Stores job descriptions that users can use for resume matching
 */

import mongoose from 'mongoose';

const jobDescriptionSchema = new mongoose.Schema(
  {
    // Reference to the user who created this job description
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Job title
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Job title cannot exceed 200 characters'],
    },
    
    // Company name (optional)
    company: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
      default: null,
    },
    
    // Job description text
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      minlength: [100, 'Job description must be at least 100 characters'],
      maxlength: [20000, 'Job description cannot exceed 20,000 characters'],
    },
    
    // Metadata for analytics (optional)
    metadata: {
      location: { type: String, default: null },
      employmentType: { 
        type: String, 
        enum: ['full-time', 'part-time', 'contract', 'internship', 'remote', null],
        default: null,
      },
      experienceLevel: {
        type: String,
        enum: ['entry', 'mid', 'senior', 'lead', 'executive', null],
        default: null,
      },
    },
    
    // Track usage
    timesUsed: {
      type: Number,
      default: 0,
    },
    
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Indexes for efficient queries
jobDescriptionSchema.index({ user: 1, createdAt: -1 });
jobDescriptionSchema.index({ user: 1, title: 1 });

// Virtual for description preview (first 200 characters)
jobDescriptionSchema.virtual('preview').get(function () {
  if (!this.description) return '';
  return this.description.length > 200 
    ? this.description.substring(0, 200) + '...' 
    : this.description;
});

// Virtual for character count
jobDescriptionSchema.virtual('characterCount').get(function () {
  return this.description ? this.description.length : 0;
});

// Virtual for word count (approximate)
jobDescriptionSchema.virtual('wordCount').get(function () {
  if (!this.description) return 0;
  return this.description.trim().split(/\s+/).length;
});

// Method to increment usage counter
jobDescriptionSchema.methods.recordUsage = async function () {
  this.timesUsed += 1;
  this.lastUsedAt = new Date();
  await this.save();
};

// Static method to find by user
jobDescriptionSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to find by user with pagination
jobDescriptionSchema.statics.findByUserPaginated = function (userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to count by user
jobDescriptionSchema.statics.countByUser = function (userId) {
  return this.countDocuments({ user: userId });
};

// Ensure virtuals are included in JSON output
jobDescriptionSchema.set('toJSON', { 
  virtuals: true,
  transform: function (doc, ret) {
    // Remove __v from output
    delete ret.__v;
    return ret;
  },
});

jobDescriptionSchema.set('toObject', { virtuals: true });

const JobDescription = mongoose.model('JobDescription', jobDescriptionSchema);

export default JobDescription;
