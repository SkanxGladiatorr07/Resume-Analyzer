/**
 * RAG Preparation Utilities
 * Helper functions to prepare data for future RAG (Retrieval-Augmented Generation) implementation
 * 
 * This module prepares the architecture for RAG without implementing vector embeddings or Pinecone.
 * It provides text preprocessing, chunking, and metadata extraction that can be used
 * when RAG is implemented in the future.
 * 
 * @module ragPreparation
 */

/**
 * Document chunk structure
 * @typedef {Object} DocumentChunk
 * @property {string} id - Unique chunk identifier
 * @property {string} text - Chunk text content
 * @property {Object} metadata - Chunk metadata
 * @property {number} chunkIndex - Index of chunk in document
 * @property {number} startOffset - Start character offset in original text
 * @property {number} endOffset - End character offset in original text
 */

/**
 * Clean and normalize text for RAG processing
 * Removes extra whitespace, normalizes line breaks, and standardizes formatting
 * 
 * @param {string} text - Raw text to clean
 * @returns {string} Cleaned text
 * 
 * @example
 * const cleaned = cleanText("  Multiple    spaces\n\n\nand breaks  ");
 * // Returns: "Multiple spaces and breaks"
 */
const cleanText = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
    .trim();
};

/**
 * Split text into semantic chunks for RAG
 * Chunks text while preserving semantic boundaries (sentences, paragraphs)
 * 
 * @param {string} text - Text to chunk
 * @param {Object} [options={}] - Chunking options
 * @param {number} [options.maxChunkSize=500] - Maximum chunk size in characters
 * @param {number} [options.overlap=50] - Character overlap between chunks
 * @param {string} [options.separator='. '] - Preferred split separator
 * @returns {Array<string>} Array of text chunks
 * 
 * @example
 * const chunks = chunkText(longText, { maxChunkSize: 300, overlap: 30 });
 */
const chunkText = (text, options = {}) => {
  const {
    maxChunkSize = 500,
    overlap = 50,
    separator = '. ',
  } = options;

  if (!text || text.length <= maxChunkSize) {
    return [text];
  }

  const chunks = [];
  const sentences = text.split(separator);
  let currentChunk = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i] + (i < sentences.length - 1 ? separator : '');

    if ((currentChunk + sentence).length <= maxChunkSize) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      // Start new chunk with overlap
      if (overlap > 0 && currentChunk) {
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + sentence;
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 0);
};

/**
 * Create document chunks with metadata for RAG
 * 
 * @param {string} text - Document text
 * @param {Object} metadata - Document metadata
 * @param {Object} [options={}] - Chunking options
 * @returns {Array<DocumentChunk>} Array of document chunks with metadata
 * 
 * @example
 * const chunks = createDocumentChunks(resumeText, {
 *   documentId: 'resume-123',
 *   userId: 'user-456',
 *   documentType: 'resume'
 * });
 */
const createDocumentChunks = (text, metadata = {}, options = {}) => {
  const cleanedText = cleanText(text);
  const textChunks = chunkText(cleanedText, options);

  return textChunks.map((chunk, index) => {
    const startOffset = cleanedText.indexOf(chunk);
    const endOffset = startOffset + chunk.length;

    return {
      id: `${metadata.documentId || 'doc'}-chunk-${index}`,
      text: chunk,
      metadata: {
        ...metadata,
        chunkIndex: index,
        totalChunks: textChunks.length,
        chunkSize: chunk.length,
      },
      chunkIndex: index,
      startOffset,
      endOffset,
    };
  });
};

/**
 * Extract metadata from resume for RAG indexing
 * Prepares structured metadata that will be useful for RAG retrieval
 * 
 * @param {Object} resume - Resume object from database
 * @returns {Object} Extracted metadata for RAG
 * 
 * @example
 * const metadata = extractResumeMetadata(resume);
 * // Returns: { documentId, userId, skills, experience, education, ... }
 */
const extractResumeMetadata = (resume) => {
  const parsedData = resume.parsedData || {};

  return {
    documentId: resume._id.toString(),
    userId: resume.userId.toString(),
    documentType: 'resume',
    fileName: resume.fileName,
    uploadedAt: resume.uploadedAt,
    skills: parsedData.skills || [],
    experience: parsedData.experience || [],
    education: parsedData.education || [],
    languages: parsedData.languages || [],
    certifications: parsedData.certifications || [],
    hasAnalysis: !!resume.analysis,
    atsScore: resume.analysis?.atsScore || null,
  };
};

/**
 * Extract metadata from job description for RAG indexing
 * 
 * @param {Object} jobMatch - Job match object from database
 * @returns {Object} Extracted metadata for RAG
 * 
 * @example
 * const metadata = extractJobMetadata(jobMatch);
 */
const extractJobMetadata = (jobMatch) => {
  return {
    documentId: jobMatch._id.toString(),
    userId: jobMatch.userId.toString(),
    documentType: 'jobDescription',
    jobTitle: jobMatch.jobTitle,
    company: jobMatch.company,
    comparedAt: jobMatch.comparedAt,
    matchScore: jobMatch.comparisonResult?.matchScore || null,
    requiredSkills: jobMatch.comparisonResult?.matchingSkills || [],
    missingSkills: jobMatch.comparisonResult?.missingSkills || [],
  };
};

/**
 * Extract metadata from AI analysis for RAG indexing
 * 
 * @param {Object} analysis - Analysis object from database
 * @returns {Object} Extracted metadata for RAG
 * 
 * @example
 * const metadata = extractAnalysisMetadata(analysis);
 */
const extractAnalysisMetadata = (analysis) => {
  return {
    documentId: analysis._id.toString(),
    userId: analysis.userId.toString(),
    resumeId: analysis.resumeId.toString(),
    documentType: 'analysis',
    atsScore: analysis.atsScore,
    overallScore: analysis.overallScore,
    analyzedAt: analysis.analyzedAt,
    strengths: analysis.strengths || [],
    improvements: analysis.improvements || [],
    keywords: analysis.keywords || [],
    missingSkills: analysis.missingSkills || [],
  };
};

/**
 * Prepare search context for RAG query
 * This will be useful when implementing semantic search
 * 
 * @param {string} query - User query
 * @param {Object} [filters={}] - Search filters
 * @returns {Object} Search context for RAG
 * 
 * @example
 * const context = prepareSearchContext(
 *   "What are my Python skills?",
 *   { userId: 'user-123', documentType: 'resume' }
 * );
 */
const prepareSearchContext = (query, filters = {}) => {
  return {
    query: cleanText(query),
    filters: {
      userId: filters.userId || null,
      documentType: filters.documentType || null,
      dateRange: filters.dateRange || null,
      ...filters,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Calculate text similarity score (simple overlap-based)
 * This is a placeholder for future embedding-based similarity
 * 
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score between 0 and 1
 * 
 * @example
 * const similarity = calculateSimilarity("JavaScript developer", "JS engineer");
 * // Returns: ~0.6
 */
const calculateSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;

  const words1 = new Set(cleanText(text1).toLowerCase().split(/\s+/));
  const words2 = new Set(cleanText(text2).toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Rank documents by relevance to query
 * Simple relevance ranking before embeddings are implemented
 * 
 * @param {string} query - Search query
 * @param {Array<Object>} documents - Array of documents to rank
 * @param {string} textField - Field name containing document text
 * @returns {Array<Object>} Ranked documents with relevance scores
 * 
 * @example
 * const ranked = rankDocumentsByRelevance(
 *   "Python developer",
 *   resumes,
 *   'parsedData.rawText'
 * );
 */
const rankDocumentsByRelevance = (query, documents, textField = 'text') => {
  return documents
    .map(doc => {
      const text = textField.split('.').reduce((obj, key) => obj?.[key], doc) || '';
      const relevanceScore = calculateSimilarity(query, text);

      return {
        ...doc,
        relevanceScore,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

/**
 * Prepare document for RAG indexing (future use)
 * Returns a structure ready for vector embedding and indexing
 * 
 * @param {Object} document - Document to prepare
 * @param {string} documentType - Type of document ('resume', 'jobDescription', 'analysis')
 * @returns {Object} Document prepared for RAG indexing
 * 
 * @example
 * const prepared = prepareDocumentForRAG(resume, 'resume');
 * // When RAG is implemented, this structure can be sent to embedding service
 */
const prepareDocumentForRAG = (document, documentType) => {
  let text = '';
  let metadata = {};

  switch (documentType) {
    case 'resume':
      text = document.parsedData?.rawText || document.parsedData?.extractedText || '';
      metadata = extractResumeMetadata(document);
      break;

    case 'jobDescription':
      text = document.jobDescription || '';
      metadata = extractJobMetadata(document);
      break;

    case 'analysis':
      text = JSON.stringify({
        strengths: document.strengths,
        improvements: document.improvements,
        summary: document.summary,
      });
      metadata = extractAnalysisMetadata(document);
      break;

    default:
      throw new Error(`Unknown document type: ${documentType}`);
  }

  const chunks = createDocumentChunks(text, metadata);

  return {
    documentId: metadata.documentId,
    documentType,
    metadata,
    chunks,
    totalChunks: chunks.length,
    preparedAt: new Date().toISOString(),
    // Future: embeddings will be added here
    // embeddings: chunks.map(chunk => generateEmbedding(chunk.text))
  };
};

module.exports = {
  cleanText,
  chunkText,
  createDocumentChunks,
  extractResumeMetadata,
  extractJobMetadata,
  extractAnalysisMetadata,
  prepareSearchContext,
  calculateSimilarity,
  rankDocumentsByRelevance,
  prepareDocumentForRAG,
};
