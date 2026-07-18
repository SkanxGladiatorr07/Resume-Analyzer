/**
 * Resume Version Model
 * Stores historical versions of resumes for comparison
 */

import mongoose from 'mongoose';

const resumeVersionSchema = new mongoose.Schema(
  {
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    // Snapshot of resume data at this version
    fileName: String,
    fileSize: Number,
    // Parsed data snapshot
    parsedData: {
      text: String,
      structuredData: {
        personalInfo: {
          name: String,
          email: String,
          phone: String,
          location: String,
          linkedin: String,
          github: String,
          website: String,
        },
        summary: String,
        experience: [
          {
            title: String,
            company: String,
            location: String,
            startDate: String,
            endDate: String,
            current: Boolean,
            description: String,
            responsibilities: [String],
          },
        ],
        education: [
          {
            degree: String,
            institution: String,
            location: String,
            graduationDate: String,
            gpa: String,
            fieldOfStudy: String,
          },
        ],
        skills: [String],
        certifications: [
          {
            name: String,
            issuer: String,
            date: String,
            expiryDate: String,
          },
        ],
        projects: [
          {
            name: String,
            description: String,
            technologies: [String],
            url: String,
          },
        ],
        languages: [String],
      },
    },
    // AI Analysis snapshot
    aiAnalysis: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      strengths: [String],
      weaknesses: [String],
      suggestions: [String],
      skills: [String],
      experienceLevel: String,
      keyAchievements: [String],
      industryFit: String,
    },
    // Metadata
    changeDescription: {
      type: String,
      default: '',
    },
    isAutoSave: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient version queries
resumeVersionSchema.index({ resume: 1, versionNumber: 1 }, { unique: true });
resumeVersionSchema.index({ resume: 1, createdAt: -1 });
resumeVersionSchema.index({ user: 1, createdAt: -1 });

/**
 * Static method: Create new version
 */
resumeVersionSchema.statics.createVersion = async function (data) {
  const {
    resumeId,
    userId,
    fileName,
    fileSize,
    parsedData,
    aiAnalysis,
    changeDescription,
    isAutoSave,
  } = data;

  // Get the latest version number
  const latestVersion = await this.findOne({ resume: resumeId })
    .sort({ versionNumber: -1 })
    .select('versionNumber')
    .lean();

  const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  const version = new this({
    resume: resumeId,
    user: userId,
    versionNumber,
    fileName,
    fileSize,
    parsedData,
    aiAnalysis,
    changeDescription: changeDescription || `Version ${versionNumber}`,
    isAutoSave: isAutoSave || false,
  });

  return version.save();
};

/**
 * Static method: Get all versions for a resume
 */
resumeVersionSchema.statics.getResumeVersions = async function (resumeId, options = {}) {
  const { limit = 50, skip = 0, includeData = false } = options;

  const query = this.find({ resume: resumeId }).sort({ versionNumber: -1 }).skip(skip).limit(limit);

  if (!includeData) {
    query.select(
      'versionNumber createdAt aiAnalysis.score changeDescription isAutoSave fileName fileSize'
    );
  }

  return query.lean();
};

/**
 * Static method: Get specific version
 */
resumeVersionSchema.statics.getVersion = async function (resumeId, versionNumber) {
  return this.findOne({
    resume: resumeId,
    versionNumber,
  }).lean();
};

/**
 * Static method: Get two versions for comparison
 */
resumeVersionSchema.statics.getVersionsForComparison = async function (
  resumeId,
  version1,
  version2
) {
  const versions = await this.find({
    resume: resumeId,
    versionNumber: { $in: [version1, version2] },
  })
    .sort({ versionNumber: 1 })
    .lean();

  if (versions.length !== 2) {
    throw new Error('One or both versions not found');
  }

  return {
    olderVersion: versions[0],
    newerVersion: versions[1],
  };
};

/**
 * Static method: Delete old versions (keep latest N)
 */
resumeVersionSchema.statics.cleanupOldVersions = async function (resumeId, keepCount = 10) {
  const versions = await this.find({ resume: resumeId })
    .sort({ versionNumber: -1 })
    .skip(keepCount)
    .select('_id')
    .lean();

  if (versions.length > 0) {
    const idsToDelete = versions.map((v) => v._id);
    await this.deleteMany({ _id: { $in: idsToDelete } });
    return idsToDelete.length;
  }

  return 0;
};

/**
 * Static method: Get version count for resume
 */
resumeVersionSchema.statics.getVersionCount = async function (resumeId) {
  return this.countDocuments({ resume: resumeId });
};

/**
 * Static method: Get user's total version count
 */
resumeVersionSchema.statics.getUserVersionCount = async function (userId) {
  return this.countDocuments({ user: userId });
};

const ResumeVersion = mongoose.model('ResumeVersion', resumeVersionSchema);

export default ResumeVersion;
