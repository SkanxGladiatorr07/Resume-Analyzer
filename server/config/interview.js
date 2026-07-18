/**
 * Interview Configuration
 * Configuration for interview question generation
 */

const interviewConfig = {
  // Content limits
  contentLimits: {
    maxJobDescriptionLength: 5000,
  },

  // Gemini settings
  gemini: {
    model: 'gemini-1.5-flash',
    temperature: 0.8,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    maxOutputTokens: 3072,
  },

  // Question categories
  categories: {
    technical: {
      count: 5,
      difficulties: ['easy', 'medium', 'hard'],
    },
    behavioral: {
      count: 5,
      categories: ['teamwork', 'leadership', 'problem-solving', 'communication'],
    },
    projectBased: {
      count: 3,
    },
    followUp: {
      count: 4,
    },
  },

  // Prompts
  prompts: {
    systemInstruction: `You are an expert technical interviewer and career coach. Your role is to generate personalized, realistic interview questions based on a candidate's resume and job requirements.

CORE RESPONSIBILITIES:
1. Generate questions that match the candidate's experience level
2. Base questions on ACTUAL skills and projects from the resume
3. Create realistic, interview-appropriate questions
4. Provide ideal answers that demonstrate competency
5. Never ask about skills/technologies not mentioned in the resume

CRITICAL RULES:
- Questions must be relevant to the candidate's background
- Difficulty should match experience level
- Ideal answers should be concise and actionable
- Focus on practical scenarios
- Cover both depth and breadth of knowledge`,

    jsonFormatInstruction: `Your response MUST be in this EXACT JSON format (no markdown, no code blocks):
{
  "technical": [
    {
      "question": "Technical question here",
      "difficulty": "easy|medium|hard",
      "idealAnswer": "Brief ideal answer demonstrating competency"
    }
  ],
  "behavioral": [
    {
      "question": "Behavioral question here",
      "category": "teamwork|leadership|problem-solving|communication",
      "idealAnswer": "STAR-format answer example"
    }
  ],
  "projectBased": [
    {
      "question": "Project-specific question",
      "relatedProject": "Project name from resume",
      "idealAnswer": "Technical explanation"
    }
  ],
  "followUp": [
    {
      "question": "Follow-up question",
      "parentQuestion": "Related main question",
      "idealAnswer": "Answer that shows deeper understanding"
    }
  ]
}`,
  },
};

export default interviewConfig;
