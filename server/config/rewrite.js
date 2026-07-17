/**
 * Rewrite Configuration
 * Centralized configuration for AI Resume Rewriter
 * 
 * @module config/rewrite
 */

/**
 * Rewrite configuration object
 */
const rewriteConfig = {
  // Supported sections
  supportedSections: ['summary', 'experience', 'projects', 'skills'],

  // Supported tones
  supportedTones: ['professional', 'technical', 'leadership', 'concise'],

  // Content limits
  contentLimits: {
    minLength: 10, // Minimum characters
    maxLength: 5000, // Maximum characters
  },

  // Gemini settings
  gemini: {
    model: 'gemini-1.5-flash',
    temperature: 0.8, // Higher for creative rewriting
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    maxOutputTokens: 2048,
  },

  // Retrieval settings for context
  retrieval: {
    enabled: true, // Use resume context for rewriting
    topK: 3, // Number of related chunks to retrieve
    minSimilarityScore: 0.6, // Lower threshold for context
  },

  // Prompt templates
  prompts: {
    // System instruction
    systemInstruction: `You are an expert resume writer and career coach. Your role is to rewrite resume content to make it more impactful, professional, and effective.

CORE RESPONSIBILITIES:
1. Rewrite content to be more compelling and achievement-focused
2. Use strong action verbs and quantifiable metrics
3. Maintain factual accuracy - NEVER invent experience or achievements
4. Adapt tone based on the specified style
5. Follow industry best practices for resume writing
6. Provide clear explanations for each improvement

CRITICAL RULES:
- Preserve ALL factual information (dates, companies, technologies, achievements)
- Do NOT add experiences, skills, or accomplishments that weren't in the original
- Do NOT change technical details or project names
- Use the ATS-friendly formatting
- Keep the same level of seniority and responsibility`,

    // Tone-specific instructions
    toneInstructions: {
      professional: `PROFESSIONAL TONE:
- Use formal, polished language
- Focus on business impact and outcomes
- Emphasize leadership and collaboration
- Use industry-standard terminology
- Maintain a confident but not boastful tone`,

      technical: `TECHNICAL TONE:
- Emphasize technical skills and tools
- Use specific technical terminology
- Highlight technical challenges and solutions
- Focus on implementation details
- Use precise technical language`,

      leadership: `LEADERSHIP TONE:
- Emphasize team leadership and mentorship
- Focus on strategic decisions and vision
- Highlight cross-functional collaboration
- Use language that shows initiative and ownership
- Demonstrate impact on team and organization`,

      concise: `CONCISE TONE:
- Use brief, punchy statements
- Remove unnecessary words and filler
- Focus on key achievements only
- Use bullet-point friendly format
- Maximize information density`,
    },

    // Section-specific guidelines
    sectionGuidelines: {
      summary: `SUMMARY SECTION GUIDELINES:
- 2-4 sentences maximum
- Lead with years of experience and key expertise
- Highlight 2-3 most impressive achievements
- Include key technical skills or domain expertise
- End with career goals or value proposition`,

      experience: `EXPERIENCE SECTION GUIDELINES:
- Start each bullet with a strong action verb
- Include quantifiable metrics (%, $, #, timeframes)
- Follow the CAR format (Context, Action, Result)
- Focus on achievements, not just responsibilities
- Keep bullets concise (1-2 lines each)`,

      projects: `PROJECTS SECTION GUIDELINES:
- Start with project name and brief description
- Highlight technologies and tools used
- Emphasize your specific contributions
- Include measurable outcomes or impact
- Show problem-solving and technical depth`,

      skills: `SKILLS SECTION GUIDELINES:
- Organize by category (Languages, Frameworks, Tools, etc.)
- List in order of proficiency/relevance
- Use standard terminology (e.g., "JavaScript" not "JS")
- Include version numbers for important technologies
- Group related skills together`,
    },

    // JSON format instruction
    jsonFormatInstruction: `Your response MUST be in this EXACT JSON format (no markdown, no code blocks, no extra text):
{
  "rewrittenContent": "The complete rewritten content here",
  "improvements": [
    {
      "type": "Action Verbs",
      "description": "Replaced weak verbs like 'worked on' with strong action verbs like 'developed' and 'implemented'"
    },
    {
      "type": "Quantification",
      "description": "Added specific metrics to demonstrate impact"
    }
  ]
}

IMPROVEMENT TYPES you can use:
- Action Verbs
- Quantification
- Clarity
- Impact Focus
- Conciseness
- Technical Precision
- ATS Optimization
- Professional Tone
- Achievement Focus
- Formatting

Each improvement MUST have a "type" and "description" explaining what was changed and why.`,

    // Context template
    contextTemplate: (content, section, tone, relatedContext) => {
      let prompt = '';

      // Add related context if available
      if (relatedContext && relatedContext.length > 0) {
        prompt += `RESUME CONTEXT (for reference):\n`;
        relatedContext.forEach((chunk, idx) => {
          prompt += `\n[${chunk.sectionName}]\n${chunk.text}\n`;
        });
        prompt += '\n---\n\n';
      }

      prompt += `SECTION TO REWRITE: ${section.toUpperCase()}\n\n`;
      prompt += `DESIRED TONE: ${tone.toUpperCase()}\n\n`;
      prompt += `ORIGINAL CONTENT:\n${content}\n\n`;
      prompt += `TASK: Rewrite the content above using the ${tone} tone while following all guidelines.\n`;

      return prompt;
    },
  },
};

/**
 * Validate section
 * @param {string} section - Section to validate
 * @returns {boolean} Is valid
 */
export const isValidSection = (section) => {
  return rewriteConfig.supportedSections.includes(section);
};

/**
 * Validate tone
 * @param {string} tone - Tone to validate
 * @returns {boolean} Is valid
 */
export const isValidTone = (tone) => {
  return rewriteConfig.supportedTones.includes(tone);
};

/**
 * Validate content length
 * @param {string} content - Content to validate
 * @returns {Object} Validation result
 */
export const validateContentLength = (content) => {
  const length = content.length;
  const { minLength, maxLength } = rewriteConfig.contentLimits;

  return {
    isValid: length >= minLength && length <= maxLength,
    length,
    minLength,
    maxLength,
  };
};

/**
 * Get configuration value
 * @param {string} path - Dot notation path
 * @returns {*} Configuration value
 */
export const getConfig = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], rewriteConfig);
};

/**
 * Get all rewrite configuration
 * @returns {Object} Complete configuration
 */
export const getAllConfig = () => {
  return { ...rewriteConfig };
};

export default rewriteConfig;
