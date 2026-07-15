/**
 * Resume Chunk Model
 * MongoDB model for storing resume chunks
 * 
 * @module models/ResumeChunk
 */

import mongoose from 'mongoose';

/**
 * Resume Chunk Schema
 * Stores individual resume chunks with metadata for RAG
 */
const resumeChunkSchema = new mongoose.Schema(
  {
    // Unique chunk identifier
    chunkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Reference to original resume
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },

    // Reference to user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Chunk text content
    text: {
      type: String,
      required: true,
    },

    // Section information
    sectionName: {
      type: String,
      required: true,
      enum: [
        'SUMMARY',
        'SKILLS',
        'EXPERIENCE',
        'PROJECTS',
        'EDUCATION',
        'CERTIFICATIONS',
        'ACHIEVEMENTS',
        'LANGUAGES',
        'PUBLICATIONS',
        'VOLUNTEER',
        'INTERESTS',
        'CONTENT',
        'OTHER',
      ],
      index: true,
    },

    // Subsection identifier (e.g., 'experience_0', 'project_1')
    subsection: {
      type: String,
      default: null,
    },

    // Chunk position within section
    chunkIndex: {
      type: Number,
      required: true,
      default: 0,
    },

    // Total chunks in this section
    totalChunks: {
      type: Number,
      required: true,
      default: 1,
    },

    // Position in original document
    startOffset: {
      type: Number,
      required: true,
    },

    endOffset: {
      type: Number,
      required: true,
    },

    // Chunk size
    chunkSize: {
      type: Number,
      required: true,
    },

    // Original file name
    fileName: {
      type: String,
      required: true,
    },

    // Document type
    documentType: {
      type: String,
      default: 'resume_chunk',
    },

    // Embedding vector (to be populated later)
    embedding: {
      type: [Number],
      default: null,
    },

    // Embedding model used
    embeddingModel: {
      type: String,
      default: null,
    },

    // Vector database ID (Pinecone)
    vectorId: {
      type: String,
      default: null,
      index: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'embedded', 'indexed', 'error'],
      default: 'pending',
      index: true,
    },

    // Error information (if any)
    error: {
      message: String,
      timestamp: Date,
    },

    // Additional metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
resumeChunkSchema.index({ resumeId: 1, sectionName: 1 });
resumeChunkSchema.index({ resumeId: 1, chunkIndex: 1 });
resumeChunkSchema.index({ userId: 1, sectionName: 1 });
resumeChunkSchema.index({ status: 1, createdAt: -1 });

// Instance methods

/**
 * Check if chunk has embedding
 * @returns {boolean} True if chunk has been embedded
 */
resumeChunkSchema.methods.hasEmbedding = function () {
  return this.embedding && this.embedding.length > 0;
};

/**
 * Check if chunk is indexed in vector database
 * @returns {boolean} True if chunk is indexed
 */
resumeChunkSchema.methods.isIndexed = function () {
  return this.status === 'indexed' && this.vectorId !== null;
};

/**
 * Mark chunk as embedded
 * @param {Array<number>} embedding - Embedding vector
 * @param {string} model - Embedding model used
 */
resumeChunkSchema.methods.markEmbedded = async function (embedding, model) {
  this.embedding = embedding;
  this.embeddingModel = model;
  this.status = 'embedded';
  await this.save();
};

/**
 * Mark chunk as indexed
 * @param {string} vectorId - Vector database ID
 */
resumeChunkSchema.methods.markIndexed = async function (vectorId) {
  this.vectorId = vectorId;
  this.status = 'indexed';
  await this.save();
};

/**
 * Mark chunk as error
 * @param {string} errorMessage - Error message
 */
resumeChunkSchema.methods.markError = async function (errorMessage) {
  this.status = 'error';
  this.error = {
    message: errorMessage,
    timestamp: new Date(),
  };
  await this.save();
};

// Static methods

/**
 * Find chunks by resume ID
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Array>} Array of chunks
 */
resumeChunkSchema.statics.findByResumeId = function (resumeId) {
  return this.find({ resumeId })
    .sort({ sectionName: 1, chunkIndex: 1 })
    .exec();
};

/**
 * Find chunks by section
 * @param {string} resumeId - Resume identifier
 * @param {string} sectionName - Section name
 * @returns {Promise<Array>} Array of chunks
 */
resumeChunkSchema.statics.findBySection = function (resumeId, sectionName) {
  return this.find({ resumeId, sectionName })
    .sort({ chunkIndex: 1 })
    .exec();
};

/**
 * Find chunks by user ID
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} Array of chunks
 */
resumeChunkSchema.statics.findByUserId = function (userId) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * Find pending chunks (not yet embedded)
 * @param {number} limit - Maximum number of chunks to return
 * @returns {Promise<Array>} Array of pending chunks
 */
resumeChunkSchema.statics.findPending = function (limit = 100) {
  return this.find({ status: 'pending' })
    .limit(limit)
    .sort({ createdAt: 1 })
    .exec();
};

/**
 * Count chunks by status
 * @returns {Promise<Object>} Status counts
 */
resumeChunkSchema.statics.countByStatus = async function () {
  const counts = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return counts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

/**
 * Get chunk statistics for a resume
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Chunk statistics
 */
resumeChunkSchema.statics.getResumeStats = async function (resumeId) {
  const stats = await this.aggregate([
    { $match: { resumeId: mongoose.Types.ObjectId(resumeId) } },
    {
      $group: {
        _id: '$sectionName',
        chunkCount: { $sum: 1 },
        totalSize: { $sum: '$chunkSize' },
        avgSize: { $avg: '$chunkSize' },
      },
    },
  ]);

  return stats;
};

/**
 * Delete chunks by resume ID
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Delete result
 */
resumeChunkSchema.statics.deleteByResumeId = function (resumeId) {
  return this.deleteMany({ resumeId }).exec();
};

/**
 * Delete chunks by user ID
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} Delete result
 */
resumeChunkSchema.statics.deleteByUserId = function (userId) {
  return this.deleteMany({ userId }).exec();
};

const ResumeChunk = mongoose.model('ResumeChunk', resumeChunkSchema);

export default ResumeChunk;
