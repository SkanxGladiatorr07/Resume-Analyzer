/**
 * Chunking Service
 * Intelligent resume chunking by logical sections
 * 
 * This service chunks resumes based on semantic sections rather than
 * fixed character counts, preserving context and meaning.
 * 
 * @module services/chunkingService
 */

/**
 * Chunk configuration
 * @typedef {Object} ChunkConfig
 * @property {number} maxChunkSize - Maximum characters per chunk
 * @property {number} minChunkSize - Minimum characters per chunk
 * @property {number} overlapSize - Overlap between chunks (for large sections)
 * @property {boolean} preserveSectionIntegrity - Keep small sections intact
 */

/**
 * Resume chunk structure
 * @typedef {Object} ResumeChunk
 * @property {string} id - Unique chunk identifier
 * @property {string} text - Chunk text content
 * @property {Object} metadata - Chunk metadata
 * @property {string} metadata.resumeId - Resume identifier
 * @property {string} metadata.userId - User identifier
 * @property {string} metadata.sectionName - Section name
 * @property {number} metadata.chunkIndex - Index within section
 * @property {number} metadata.totalChunks - Total chunks in section
 * @property {number} metadata.startOffset - Start position in original text
 * @property {number} metadata.endOffset - End position in original text
 * @property {string} metadata.fileName - Original file name
 */

/**
 * Default chunking configuration
 */
const DEFAULT_CONFIG = {
  maxChunkSize: 1000, // Maximum characters per chunk
  minChunkSize: 100, // Minimum characters per chunk
  overlapSize: 100, // Overlap between chunks
  preserveSectionIntegrity: true, // Keep small sections intact
};

/**
 * Standard resume sections to identify and chunk
 */
const RESUME_SECTIONS = {
  SUMMARY: ['summary', 'objective', 'profile', 'about'],
  SKILLS: ['skills', 'technical skills', 'core competencies', 'expertise'],
  EXPERIENCE: ['experience', 'work experience', 'professional experience', 'employment'],
  PROJECTS: ['projects', 'key projects', 'notable projects'],
  EDUCATION: ['education', 'academic background', 'qualifications'],
  CERTIFICATIONS: ['certifications', 'certificates', 'licenses'],
  ACHIEVEMENTS: ['achievements', 'accomplishments', 'awards'],
  LANGUAGES: ['languages', 'language proficiency'],
  PUBLICATIONS: ['publications', 'research', 'papers'],
  VOLUNTEER: ['volunteer', 'volunteering', 'community service'],
  INTERESTS: ['interests', 'hobbies', 'personal interests'],
};

/**
 * Normalize section name to standard format
 * 
 * @param {string} sectionName - Raw section name
 * @returns {string} Normalized section name
 * 
 * @example
 * normalizeSectionName('Technical Skills'); // 'SKILLS'
 * normalizeSectionName('Work Experience'); // 'EXPERIENCE'
 */
const normalizeSectionName = (sectionName) => {
  const normalized = sectionName.toLowerCase().trim();

  for (const [standardName, variants] of Object.entries(RESUME_SECTIONS)) {
    if (variants.some((variant) => normalized.includes(variant))) {
      return standardName;
    }
  }

  return 'OTHER';
};

/**
 * Extract sections from resume parsed data
 * Identifies logical sections in the resume
 * 
 * @param {Object} parsedData - Parsed resume data
 * @returns {Array<{name: string, content: string}>} Array of sections
 * 
 * @example
 * const sections = extractSections(resume.parsedData);
 * // Returns: [
 * //   { name: 'SUMMARY', content: '...' },
 * //   { name: 'SKILLS', content: '...' }
 * // ]
 */
const extractSections = (parsedData) => {
  const sections = [];

  // Extract summary/objective
  if (parsedData.summary) {
    sections.push({
      name: 'SUMMARY',
      content: parsedData.summary,
    });
  }

  // Extract skills
  if (parsedData.skills && parsedData.skills.length > 0) {
    const skillsContent = Array.isArray(parsedData.skills)
      ? parsedData.skills.join(', ')
      : String(parsedData.skills);

    sections.push({
      name: 'SKILLS',
      content: `Skills: ${skillsContent}`,
    });
  }

  // Extract experience
  if (parsedData.experience && parsedData.experience.length > 0) {
    parsedData.experience.forEach((exp, index) => {
      const expContent = [
        exp.title || exp.position,
        exp.company,
        exp.location,
        exp.duration || `${exp.startDate} - ${exp.endDate}`,
        exp.description,
      ]
        .filter(Boolean)
        .join('\n');

      sections.push({
        name: 'EXPERIENCE',
        content: expContent,
        subsection: `experience_${index}`,
      });
    });
  }

  // Extract projects
  if (parsedData.projects && parsedData.projects.length > 0) {
    parsedData.projects.forEach((project, index) => {
      const projectContent = [
        project.name || project.title,
        project.description,
        project.technologies ? `Technologies: ${project.technologies.join(', ')}` : '',
        project.link || project.url,
      ]
        .filter(Boolean)
        .join('\n');

      sections.push({
        name: 'PROJECTS',
        content: projectContent,
        subsection: `project_${index}`,
      });
    });
  }

  // Extract education
  if (parsedData.education && parsedData.education.length > 0) {
    parsedData.education.forEach((edu, index) => {
      const eduContent = [
        edu.degree,
        edu.institution || edu.school,
        edu.location,
        edu.graduationYear || edu.year,
        edu.gpa ? `GPA: ${edu.gpa}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      sections.push({
        name: 'EDUCATION',
        content: eduContent,
        subsection: `education_${index}`,
      });
    });
  }

  // Extract certifications
  if (parsedData.certifications && parsedData.certifications.length > 0) {
    const certsContent = parsedData.certifications
      .map((cert) => {
        if (typeof cert === 'string') return cert;
        return [cert.name, cert.issuer, cert.date].filter(Boolean).join(' - ');
      })
      .join('\n');

    sections.push({
      name: 'CERTIFICATIONS',
      content: certsContent,
    });
  }

  // Extract languages
  if (parsedData.languages && parsedData.languages.length > 0) {
    const languagesContent = Array.isArray(parsedData.languages)
      ? parsedData.languages.join(', ')
      : String(parsedData.languages);

    sections.push({
      name: 'LANGUAGES',
      content: `Languages: ${languagesContent}`,
    });
  }

  // If no structured sections found, use raw text
  if (sections.length === 0 && parsedData.rawText) {
    sections.push({
      name: 'CONTENT',
      content: parsedData.rawText,
    });
  }

  return sections;
};

/**
 * Split large section into overlapping chunks
 * Used when a section exceeds maxChunkSize
 * 
 * @param {string} content - Section content to split
 * @param {ChunkConfig} config - Chunking configuration
 * @returns {Array<string>} Array of chunk texts
 * 
 * @example
 * const chunks = splitIntoChunks(longText, { maxChunkSize: 1000, overlapSize: 100 });
 */
const splitIntoChunks = (content, config) => {
  const { maxChunkSize, overlapSize } = config;

  if (content.length <= maxChunkSize) {
    return [content];
  }

  const chunks = [];
  let startPos = 0;

  while (startPos < content.length) {
    let endPos = startPos + maxChunkSize;

    // If not at the end, try to find a good break point
    if (endPos < content.length) {
      // Try to break at sentence boundary (. ! ?)
      const sentenceBreak = content.lastIndexOf('.', endPos);
      const exclamationBreak = content.lastIndexOf('!', endPos);
      const questionBreak = content.lastIndexOf('?', endPos);

      const breakPoint = Math.max(sentenceBreak, exclamationBreak, questionBreak);

      if (breakPoint > startPos + config.minChunkSize) {
        endPos = breakPoint + 1;
      } else {
        // Try to break at newline
        const newlineBreak = content.lastIndexOf('\n', endPos);
        if (newlineBreak > startPos + config.minChunkSize) {
          endPos = newlineBreak + 1;
        } else {
          // Break at space
          const spaceBreak = content.lastIndexOf(' ', endPos);
          if (spaceBreak > startPos + config.minChunkSize) {
            endPos = spaceBreak + 1;
          }
        }
      }
    }

    chunks.push(content.substring(startPos, endPos).trim());

    // Move start position with overlap
    startPos = endPos - overlapSize;

    // Ensure we make progress
    if (startPos <= chunks[chunks.length - 1].length - overlapSize) {
      startPos = endPos;
    }
  }

  return chunks;
};

/**
 * Create chunk metadata
 * 
 * @param {Object} params - Metadata parameters
 * @returns {Object} Chunk metadata
 */
const createChunkMetadata = (params) => {
  const {
    resumeId,
    userId,
    fileName,
    sectionName,
    chunkIndex,
    totalChunks,
    startOffset,
    endOffset,
    subsection,
  } = params;

  return {
    resumeId: resumeId.toString(),
    userId: userId.toString(),
    fileName: fileName || 'unknown',
    sectionName,
    subsection: subsection || null,
    chunkIndex,
    totalChunks,
    startOffset,
    endOffset,
    chunkSize: endOffset - startOffset,
    createdAt: new Date().toISOString(),
    documentType: 'resume_chunk',
  };
};

/**
 * Chunk resume by logical sections
 * Main chunking function that processes a resume
 * 
 * @param {Object} resume - Resume document from database
 * @param {ChunkConfig} [config=DEFAULT_CONFIG] - Chunking configuration
 * @returns {Promise<Array<ResumeChunk>>} Array of resume chunks
 * @throws {Error} If chunking fails
 * 
 * @example
 * const chunks = await chunkResume(resume, {
 *   maxChunkSize: 1000,
 *   overlapSize: 100
 * });
 * 
 * chunks.forEach(chunk => {
 *   console.log(`${chunk.metadata.sectionName}: ${chunk.text.length} chars`);
 * });
 */
export const chunkResume = async (resume, config = DEFAULT_CONFIG) => {
  try {
    if (!resume || !resume.parsedData) {
      throw new Error('Resume must have parsedData');
    }

    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const chunks = [];

    // Extract logical sections
    const sections = extractSections(resume.parsedData);

    if (sections.length === 0) {
      throw new Error('No sections found in resume');
    }

    console.log(`[ChunkingService] Found ${sections.length} sections in resume ${resume._id}`);

    let globalOffset = 0;

    // Process each section
    for (const section of sections) {
      const sectionContent = section.content.trim();

      if (sectionContent.length < mergedConfig.minChunkSize) {
        // Section is too small, skip or combine with next
        if (mergedConfig.preserveSectionIntegrity) {
          continue;
        }
      }

      // Split section into chunks if needed
      const sectionChunks = splitIntoChunks(sectionContent, mergedConfig);

      // Create chunk objects
      sectionChunks.forEach((chunkText, index) => {
        const startOffset = globalOffset;
        const endOffset = globalOffset + chunkText.length;

        const chunk = {
          id: `${resume._id}_${section.name}_${index}`,
          text: chunkText,
          metadata: createChunkMetadata({
            resumeId: resume._id,
            userId: resume.userId,
            fileName: resume.fileName,
            sectionName: section.name,
            subsection: section.subsection,
            chunkIndex: index,
            totalChunks: sectionChunks.length,
            startOffset,
            endOffset,
          }),
        };

        chunks.push(chunk);
        globalOffset = endOffset + 1; // +1 for spacing between sections
      });
    }

    console.log(`[ChunkingService] Created ${chunks.length} chunks for resume ${resume._id}`);
    return chunks;
  } catch (error) {
    console.error('[ChunkingService] Error chunking resume:', error.message);
    throw new Error(`Failed to chunk resume: ${error.message}`);
  }
};

/**
 * Chunk multiple resumes in batch
 * 
 * @param {Array<Object>} resumes - Array of resume documents
 * @param {ChunkConfig} [config=DEFAULT_CONFIG] - Chunking configuration
 * @returns {Promise<Array<ResumeChunk>>} Array of all chunks
 * 
 * @example
 * const allChunks = await chunkResumesBatch(resumes);
 * console.log(`Total chunks: ${allChunks.length}`);
 */
export const chunkResumesBatch = async (resumes, config = DEFAULT_CONFIG) => {
  try {
    if (!Array.isArray(resumes) || resumes.length === 0) {
      throw new Error('Resumes must be a non-empty array');
    }

    const allChunks = [];

    for (const resume of resumes) {
      try {
        const chunks = await chunkResume(resume, config);
        allChunks.push(...chunks);
      } catch (error) {
        console.error(
          `[ChunkingService] Error chunking resume ${resume._id}:`,
          error.message
        );
        // Continue with other resumes
      }
    }

    console.log(
      `[ChunkingService] Batch chunking complete: ${allChunks.length} total chunks from ${resumes.length} resumes`
    );

    return allChunks;
  } catch (error) {
    console.error('[ChunkingService] Error in batch chunking:', error.message);
    throw new Error(`Failed to chunk resumes batch: ${error.message}`);
  }
};

/**
 * Get chunking statistics for a resume
 * 
 * @param {Object} resume - Resume document
 * @param {ChunkConfig} [config=DEFAULT_CONFIG] - Chunking configuration
 * @returns {Promise<Object>} Chunking statistics
 * 
 * @example
 * const stats = await getChunkingStats(resume);
 * console.log(`Sections: ${stats.sectionCount}`);
 * console.log(`Chunks: ${stats.totalChunks}`);
 */
export const getChunkingStats = async (resume, config = DEFAULT_CONFIG) => {
  try {
    const chunks = await chunkResume(resume, config);

    const sectionStats = {};
    chunks.forEach((chunk) => {
      const section = chunk.metadata.sectionName;
      if (!sectionStats[section]) {
        sectionStats[section] = {
          chunkCount: 0,
          totalSize: 0,
          avgSize: 0,
        };
      }

      sectionStats[section].chunkCount++;
      sectionStats[section].totalSize += chunk.text.length;
    });

    // Calculate averages
    Object.keys(sectionStats).forEach((section) => {
      sectionStats[section].avgSize = Math.round(
        sectionStats[section].totalSize / sectionStats[section].chunkCount
      );
    });

    return {
      resumeId: resume._id.toString(),
      totalChunks: chunks.length,
      sectionCount: Object.keys(sectionStats).length,
      sectionStats,
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.text.length, 0),
      avgChunkSize: Math.round(
        chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) / chunks.length
      ),
    };
  } catch (error) {
    console.error('[ChunkingService] Error calculating stats:', error.message);
    throw new Error(`Failed to calculate chunking stats: ${error.message}`);
  }
};

/**
 * Validate chunk structure
 * 
 * @param {ResumeChunk} chunk - Chunk to validate
 * @returns {boolean} True if chunk is valid
 * 
 * @example
 * if (validateChunk(chunk)) {
 *   await storeChunk(chunk);
 * }
 */
export const validateChunk = (chunk) => {
  if (!chunk || typeof chunk !== 'object') {
    return false;
  }

  // Check required fields
  if (!chunk.id || !chunk.text || !chunk.metadata) {
    return false;
  }

  // Check metadata
  const { metadata } = chunk;
  const requiredMetadata = [
    'resumeId',
    'userId',
    'sectionName',
    'chunkIndex',
    'totalChunks',
  ];

  for (const field of requiredMetadata) {
    if (!metadata[field] && metadata[field] !== 0) {
      return false;
    }
  }

  return true;
};

/**
 * Reconstruct section from chunks
 * Combines chunks back into original section
 * 
 * @param {Array<ResumeChunk>} chunks - Chunks from same section
 * @returns {string} Reconstructed section text
 * 
 * @example
 * const sectionChunks = chunks.filter(c => c.metadata.sectionName === 'EXPERIENCE');
 * const fullSection = reconstructSection(sectionChunks);
 */
export const reconstructSection = (chunks) => {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return '';
  }

  // Sort chunks by index
  const sortedChunks = [...chunks].sort(
    (a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex
  );

  // For single chunk, return as is
  if (sortedChunks.length === 1) {
    return sortedChunks[0].text;
  }

  // For multiple chunks, handle overlap
  const reconstructed = [sortedChunks[0].text];

  for (let i = 1; i < sortedChunks.length; i++) {
    const currentChunk = sortedChunks[i].text;
    const prevChunk = sortedChunks[i - 1].text;

    // Find overlap between consecutive chunks
    let overlapSize = 0;
    const maxOverlap = Math.min(prevChunk.length, currentChunk.length) / 2;

    for (let j = 1; j <= maxOverlap; j++) {
      const prevEnd = prevChunk.substring(prevChunk.length - j);
      const currentStart = currentChunk.substring(0, j);

      if (prevEnd === currentStart) {
        overlapSize = j;
      }
    }

    // Add non-overlapping part
    reconstructed.push(currentChunk.substring(overlapSize));
  }

  return reconstructed.join('');
};

export default {
  chunkResume,
  chunkResumesBatch,
  getChunkingStats,
  validateChunk,
  reconstructSection,
  extractSections,
  normalizeSectionName,
  DEFAULT_CONFIG,
  RESUME_SECTIONS,
};
