import mongoose from 'mongoose';

/**
 * Resume Schema
 * Stores information about uploaded resumes
 */
const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['pdf', 'docx'],
    },
    filePath: {
      type: String,
      required: true,
    },
    // Extracted text content
    extractedText: {
      type: String,
      default: null,
    },
    // Parsing status
    parsingStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    parsingError: {
      type: String,
      default: null,
    },
    // Text metadata
    wordCount: {
      type: Number,
      default: 0,
    },
    // Structured parsed data
    structuredData: {
      contactInfo: {
        name: { type: String, default: null },
        email: { type: String, default: null },
        phone: { type: String, default: null },
        linkedin: { type: String, default: null },
        github: { type: String, default: null },
      },
      skills: [{ type: String }],
      education: [{
        degree: { type: String, default: null },
        institution: { type: String, default: null },
        year: { type: String, default: null },
        location: { type: String, default: null },
      }],
      experience: [{
        title: { type: String, default: null },
        company: { type: String, default: null },
        duration: { type: String, default: null },
        location: { type: String, default: null },
        description: [{ type: String }],
      }],
      projects: [{
        name: { type: String, default: null },
        technologies: [{ type: String }],
        description: [{ type: String }],
      }],
      certifications: [{
        name: { type: String, default: null },
        issuer: { type: String, default: null },
        date: { type: String, default: null },
      }],
      languages: [{
        language: { type: String, default: null },
        proficiency: { type: String, default: null },
      }],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
