/**
 * Embedding Utilities
 * Prepares text for future semantic search using embeddings
 * 
 * ARCHITECTURE NOTES:
 * - This module prepares the foundation for semantic search
 * - Does NOT implement actual vector embeddings (as per requirements)
 * - Provides text preprocessing and chunking for future embedding generation
 * - Designed to work with future Pinecone or similar vector databases
 * 
 * FUTURE INTEGRATION:
 * When implementing embeddings, you would:
 * 1. Use prepareTextForEmbedding() to clean and normalize text
 * 2. Use chunkTextForEmbedding() to split large texts
 * 3. Generate embeddings using OpenAI/Cohere/etc API
 * 4. Store embeddings in vector database (Pinecone, Weaviate, etc)
 * 5. Use embeddings for semantic job matching
 */

/**
 * Prepare text for embedding generation
 * Cleans, normalizes, and formats text for optimal embedding quality
 * @param {string} text - Raw text to prepare
 * @returns {string} Cleaned and normalized text
 */
export const prepareTextForEmbedding = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let prepared = text;

  // Remove excessive whitespace
  prepared = prepared.replace(/\s+/g, ' ');

  // Remove special characters that don't add semantic meaning
  prepared = prepared.replace(/[^\w\s.,;:!?()\-\[\]{}'"\/\\@#$%&*+=<>]/g, '');

  // Normalize case (embeddings work better with consistent casing)
  prepared = prepared.toLowerCase();

  // Remove multiple punctuation
  prepared = prepared.replace(/([.,!?;:]){2,}/g, '$1');

  // Trim
  prepared = prepared.trim();

  return prepared;
};

/**
 * Chunk text for embedding
 * Splits large texts into manageable chunks for embedding generation
 * @param {string} text - Text to chunk
 * @param {number} maxChunkSize - Maximum chunk size in characters (default: 1000)
 * @param {number} overlap - Overlap between chunks in characters (default: 200)
 * @returns {Array<string>} Array of text chunks
 */
export const chunkTextForEmbedding = (text, maxChunkSize = 1000, overlap = 200) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const chunks = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    // Extract chunk
    const chunk = text.slice(currentPosition, currentPosition + maxChunkSize);
    
    // Try to break at sentence boundary
    let breakPoint = maxChunkSize;
    if (currentPosition + maxChunkSize < text.length) {
      const lastPeriod = chunk.lastIndexOf('. ');
      const lastNewline = chunk.lastIndexOf('\n');
      breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint === -1) {
        breakPoint = maxChunkSize;
      }
    }

    chunks.push(chunk.slice(0, breakPoint).trim());
    
    // Move position with overlap
    currentPosition += breakPoint - overlap;
    
    // Prevent infinite loop
    if (breakPoint === 0) {
      currentPosition += maxChunkSize;
    }
  }

  return chunks;
};

/**
 * Extract semantic keywords from text
 * Identifies important terms for semantic search
 * @param {string} text - Text to analyze
 * @param {number} maxKeywords - Maximum keywords to extract (default: 20)
 * @returns {Array<string>} Array of keywords
 */
export const extractSemanticKeywords = (text, maxKeywords = 20) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Convert to lowercase
  const normalized = text.toLowerCase();

  // Common stop words to exclude
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'this', 'their', 'they', 'we', 'you',
  ]);

  // Extract words
  const words = normalized.match(/\b[a-z]{3,}\b/g) || [];

  // Count word frequency
  const wordFreq = {};
  for (const word of words) {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  // Sort by frequency and take top keywords
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);

  return keywords;
};

/**
 * Prepare resume data for embedding
 * Extracts and formats key sections from resume
 * @param {Object} resumeData - Structured resume data
 * @returns {Object} Prepared embedding data
 */
export const prepareResumeForEmbedding = (resumeData) => {
  if (!resumeData || typeof resumeData !== 'object') {
    return {
      fullText: '',
      sections: {},
      keywords: [],
    };
  }

  const sections = {};
  const allText = [];

  // Extract contact info
  if (resumeData.contactInfo) {
    const contact = resumeData.contactInfo;
    sections.contact = prepareTextForEmbedding(
      `${contact.name || ''} ${contact.email || ''} ${contact.phone || ''}`
    );
    allText.push(sections.contact);
  }

  // Extract summary/objective
  if (resumeData.summary) {
    sections.summary = prepareTextForEmbedding(resumeData.summary);
    allText.push(sections.summary);
  }

  // Extract skills
  if (Array.isArray(resumeData.skills)) {
    sections.skills = prepareTextForEmbedding(resumeData.skills.join(', '));
    allText.push(sections.skills);
  }

  // Extract experience
  if (Array.isArray(resumeData.experience)) {
    sections.experience = resumeData.experience.map(exp =>
      prepareTextForEmbedding(
        `${exp.title || ''} at ${exp.company || ''}: ${exp.description || ''}`
      )
    ).join(' ');
    allText.push(sections.experience);
  }

  // Extract education
  if (Array.isArray(resumeData.education)) {
    sections.education = resumeData.education.map(edu =>
      prepareTextForEmbedding(
        `${edu.degree || ''} from ${edu.school || ''}`
      )
    ).join(' ');
    allText.push(sections.education);
  }

  const fullText = allText.join(' ');

  return {
    fullText,
    sections,
    keywords: extractSemanticKeywords(fullText),
    chunks: chunkTextForEmbedding(fullText),
  };
};

/**
 * Prepare job description for embedding
 * Extracts and formats key sections from job description
 * @param {string} jobDescription - Job description text
 * @param {string} jobTitle - Job title
 * @returns {Object} Prepared embedding data
 */
export const prepareJobDescriptionForEmbedding = (jobDescription, jobTitle = '') => {
  if (!jobDescription || typeof jobDescription !== 'string') {
    return {
      fullText: '',
      keywords: [],
      chunks: [],
    };
  }

  const fullText = prepareTextForEmbedding(
    `${jobTitle} ${jobDescription}`
  );

  return {
    fullText,
    title: prepareTextForEmbedding(jobTitle),
    keywords: extractSemanticKeywords(fullText),
    chunks: chunkTextForEmbedding(fullText),
  };
};

/**
 * Calculate text similarity (simple keyword-based)
 * Placeholder for future vector similarity
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score (0-1)
 */
export const calculateTextSimilarity = (text1, text2) => {
  const keywords1 = new Set(extractSemanticKeywords(text1, 50));
  const keywords2 = new Set(extractSemanticKeywords(text2, 50));

  if (keywords1.size === 0 || keywords2.size === 0) {
    return 0;
  }

  // Calculate Jaccard similarity
  const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
  const union = new Set([...keywords1, ...keywords2]);

  return intersection.size / union.size;
};

/**
 * Prepare embedding metadata
 * Creates metadata object for vector database storage
 * @param {Object} data - Source data
 * @param {string} type - Type (resume, jobDescription)
 * @returns {Object} Metadata object
 */
export const prepareEmbeddingMetadata = (data, type) => {
  const metadata = {
    type,
    createdAt: new Date().toISOString(),
  };

  if (type === 'resume') {
    metadata.userId = data.user?.toString();
    metadata.resumeId = data._id?.toString();
    metadata.name = data.originalName;
  } else if (type === 'jobDescription') {
    metadata.userId = data.user?.toString();
    metadata.jobDescriptionId = data._id?.toString();
    metadata.title = data.title;
    metadata.company = data.company;
  }

  return metadata;
};

/**
 * FUTURE: Generate embedding (placeholder)
 * This would call an embedding API (OpenAI, Cohere, etc)
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} Embedding vector (placeholder)
 */
export const generateEmbedding = async (text) => {
  // PLACEHOLDER - Future implementation would call embedding API
  // Example:
  // const response = await openai.embeddings.create({
  //   model: 'text-embedding-ada-002',
  //   input: text,
  // });
  // return response.data[0].embedding;
  
  throw new Error('Embedding generation not implemented. This is a placeholder for future integration.');
};

/**
 * FUTURE: Store embedding (placeholder)
 * This would store in vector database (Pinecone, Weaviate, etc)
 * @param {string} id - Document ID
 * @param {Array<number>} embedding - Embedding vector
 * @param {Object} metadata - Document metadata
 * @returns {Promise<void>}
 */
export const storeEmbedding = async (id, embedding, metadata) => {
  // PLACEHOLDER - Future implementation would store in vector database
  // Example with Pinecone:
  // await pineconeIndex.upsert([{
  //   id,
  //   values: embedding,
  //   metadata,
  // }]);
  
  throw new Error('Embedding storage not implemented. This is a placeholder for future integration.');
};

/**
 * FUTURE: Search similar embeddings (placeholder)
 * This would query vector database for similar documents
 * @param {Array<number>} queryEmbedding - Query embedding vector
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array>} Similar documents
 */
export const searchSimilarEmbeddings = async (queryEmbedding, topK = 10) => {
  // PLACEHOLDER - Future implementation would query vector database
  // Example with Pinecone:
  // const results = await pineconeIndex.query({
  //   vector: queryEmbedding,
  //   topK,
  //   includeMetadata: true,
  // });
  // return results.matches;
  
  throw new Error('Embedding search not implemented. This is a placeholder for future integration.');
};
