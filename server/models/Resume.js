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
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
