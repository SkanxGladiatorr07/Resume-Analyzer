/**
 * STAR Configuration
 * Centralized configuration for STAR Bullet Generator
 * 
 * @module config/star
 */

/**
 * STAR configuration object
 */
const starConfig = {
  // Content limits
  contentLimits: {
    minLength: 15, // Minimum characters for meaningful experience
    maxLength: 2000, // Maximum characters
  },

  // Gemini settings
  gemini: {
    model: 'gemini-1.5-flash',
    temperature: 0.7, // Balanced creativity and accuracy
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    maxOutputTokens: 2048,
  },

  // STAR format guidelines
  starGuidelines: {
    situation: {
      description: 'Context and background',
      maxLength: 200,
      tips: [
        'Describe the context or challenge',
        'Set the scene briefly',
        'Include relevant background',
      ],
    },
    task: {
      description: 'Your responsibility or goal',
      maxLength: 150,
      tips: [
        'What was your specific responsibility?',
        'What was the goal or objective?',
        'What problem needed solving?',
      ],
    },
    action: {
      description: 'What you did',
      maxLength: 300,
      tips: [
        'Use strong action verbs',
        'Describe specific steps taken',
        'Highlight your contributions',
        'Mention tools/technologies used',
      ],
    },
    result: {
      description: 'Measurable outcome or impact',
      maxLength: 200,
      tips: [
        'Quantify the impact (%, $, #, time)',
        'Show measurable improvements',
        'Highlight business value',
        'Use specific metrics from original content',
      ],
    },
  },

  // Prompt templates
  prompts: {
    // System instruction
    systemInstruction: `You are an expert resume writer specializing in the STAR (Situation, Task, Action, Result) method. Your role is to transform regular experience descriptions into compelling STAR-format bullet points.

CORE RESPONSIBILITIES:
1. Convert experience into clear STAR format
2. Maintain complete factual accuracy
3. Highlight measurable impact ONLY if explicitly stated in the original
4. Use strong action verbs
5. Keep content concise and impactful
6. Never invent or fabricate achievements

CRITICAL RULES:
- NEVER add metrics, numbers, or achievements not present in the original
- NEVER invent technologies, tools, or responsibilities
- ONLY use information explicitly stated in the original experience
- If no metrics are present, don't fabricate them
- Preserve ALL factual details from the original
- Focus on clarity and structure, not embellishment`,

    // STAR format instruction
    starFormatInstruction: `STAR FORMAT BREAKDOWN:

S - SITUATION (Context):
• Brief background or challenge
• Set the scene in 1-2 sentences
• Provide necessary context

T - TASK (Responsibility):
• Your specific role or objective
• What you were responsible for
• The goal you needed to achieve

A - ACTION (What You Did):
• Specific steps you took
• Tools and technologies you used
• Skills you applied
• How you approached the problem

R - RESULT (Outcome):
• Impact of your actions
• Measurable outcomes (ONLY if present in original)
• Business value delivered
• What was achieved

EXAMPLE TRANSFORMATION:

ORIGINAL:
"Worked on improving the website performance and fixed various bugs"

STAR VERSION:
"Optimized website performance by identifying and resolving critical bugs, implementing code refactoring strategies, resulting in improved user experience and system stability"

BREAKDOWN:
- Situation: Website had performance issues and bugs
- Task: Improve performance and resolve bugs
- Action: Identified critical bugs, implemented code refactoring strategies
- Result: Improved user experience and system stability`,

    // JSON format instruction
    jsonFormatInstruction: `Your response MUST be in this EXACT JSON format (no markdown, no code blocks, no extra text):
{
  "original": "The original experience text exactly as provided",
  "starVersion": "Complete STAR-formatted bullet point (1-2 sentences, concise and impactful)",
  "breakdown": {
    "situation": "Brief context or challenge",
    "task": "Specific responsibility or goal",
    "action": "What you did and how",
    "result": "Measurable outcome or impact"
  }
}

IMPORTANT:
- The "starVersion" should be a polished, concise bullet point (not a paragraph)
- Each breakdown field should be 1-2 sentences
- ONLY include metrics/numbers that were in the original experience
- If no metrics are available, focus on qualitative improvements
- Use strong action verbs (developed, implemented, led, optimized, etc.)
- Keep it professional and impactful

Remember: Your response must be ONLY the JSON object. No additional text or markdown formatting.`,

    // Content template
    contentTemplate: (experience) => {
      return `ORIGINAL EXPERIENCE TO CONVERT:
${experience}

TASK: Convert the above experience into STAR format following all guidelines. Maintain complete factual accuracy and NEVER add information not present in the original.`;
    },
  },

  // Logging settings
  logging: {
    enabled: process.env.NODE_ENV !== 'test',
    logLevel: process.env.LOG_LEVEL || 'info',
    includeTimings: true,
  },
};

/**
 * Validate content length
 * @param {string} content - Content to validate
 * @returns {Object} Validation result
 */
export const validateContentLength = (content) => {
  const length = content.length;
  const { minLength, maxLength } = starConfig.contentLimits;

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
  return path.split('.').reduce((obj, key) => obj?.[key], starConfig);
};

/**
 * Get all STAR configuration
 * @returns {Object} Complete configuration
 */
export const getAllConfig = () => {
  return { ...starConfig };
};

export default starConfig;
