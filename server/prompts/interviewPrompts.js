/**
 * Interview Questions Prompts
 * Centralized prompt templates for interview question generation
 */

export const SYSTEM_ROLE = 'expert technical interviewer and career coach';

export const RESPONSIBILITIES = [
  'Generate personalized interview questions based on candidate resume',
  'Create questions across technical, behavioral, project-based, and follow-up categories',
  'Provide ideal answers to help candidates prepare',
  'Tailor questions to target job requirements when provided',
  'Ensure questions are realistic and industry-appropriate',
];

export const CRITICAL_RULES = [
  'Questions must be relevant to candidate skills and experience',
  'Ideal answers should be comprehensive but concise',
  'Technical questions should vary in difficulty',
  'Behavioral questions should cover different competency areas',
  'Project questions must reference actual resume projects',
  'Follow-up questions should probe deeper understanding',
];

export const QUESTION_CATEGORIES = {
  technical: {
    description: 'Technical knowledge and problem-solving questions',
    count: 5,
    guidelines: [
      'Mix difficulty levels (2 easy, 2 medium, 1 hard)',
      'Cover key technologies from resume',
      'Include both conceptual and practical questions',
      'Test depth of understanding',
      'Ask about best practices and trade-offs',
    ],
    structure: {
      question: 'Clear, specific technical question',
      difficulty: 'easy|medium|hard',
      topic: 'Technology or concept being tested',
      idealAnswer: 'Comprehensive answer demonstrating expertise',
    },
  },
  behavioral: {
    description: 'Behavioral and situational questions using STAR method',
    count: 5,
    guidelines: [
      'Cover different competencies (leadership, teamwork, problem-solving, communication, adaptability)',
      'Use "Tell me about a time when..." format',
      'Relate to candidate experience level',
      'Expect STAR-formatted answers',
      'Test soft skills and cultural fit',
    ],
    structure: {
      question: 'Behavioral question prompting STAR response',
      category: 'leadership|teamwork|problem-solving|communication|adaptability',
      idealAnswer: 'STAR-formatted answer with specific example',
    },
  },
  projectBased: {
    description: 'Deep-dive questions about specific resume projects',
    count: 3,
    guidelines: [
      'Reference actual projects from resume',
      'Ask about design decisions and trade-offs',
      'Probe technical implementation details',
      'Explore challenges and solutions',
      'Understand candidate contributions',
    ],
    structure: {
      question: 'Project-specific technical question',
      project: 'Name of project from resume',
      idealAnswer: 'Detailed technical answer with context',
    },
  },
  followUp: {
    description: 'Follow-up questions to deepen understanding',
    count: 4,
    guidelines: [
      'Build on technical or project questions',
      'Test depth of knowledge',
      'Explore alternative approaches',
      'Ask about lessons learned',
      'Probe decision-making process',
    ],
    structure: {
      question: 'Probing follow-up question',
      context: 'What this follows up on',
      idealAnswer: 'Thoughtful, detailed answer',
    },
  },
};

export const JSON_STRUCTURE = {
  technical: [
    {
      question: 'string',
      difficulty: 'easy|medium|hard',
      topic: 'string',
      idealAnswer: 'string',
    },
  ],
  behavioral: [
    {
      question: 'string',
      category: 'leadership|teamwork|problem-solving|communication|adaptability',
      idealAnswer: 'string',
    },
  ],
  projectBased: [
    {
      question: 'string',
      project: 'string',
      idealAnswer: 'string',
    },
  ],
  followUp: [
    {
      question: 'string',
      context: 'string',
      idealAnswer: 'string',
    },
  ],
};

export const buildInterviewPrompt = ({ resumeContext, aiAnalysis, jobDescription }) => {
  let prompt = '';

  // System role
  prompt += `You are an expert ${SYSTEM_ROLE}.\n\n`;

  // Responsibilities
  prompt += 'RESPONSIBILITIES:\n';
  RESPONSIBILITIES.forEach((resp, idx) => {
    prompt += `${idx + 1}. ${resp}\n`;
  });
  prompt += '\n';

  // Critical rules
  prompt += 'CRITICAL RULES:\n';
  CRITICAL_RULES.forEach((rule) => {
    prompt += `- ${rule}\n`;
  });
  prompt += '\n';

  // Question categories
  prompt += 'QUESTION CATEGORIES:\n\n';
  Object.entries(QUESTION_CATEGORIES).forEach(([category, details]) => {
    prompt += `${category.toUpperCase()} (${details.count} questions)\n`;
    prompt += `Description: ${details.description}\n`;
    prompt += 'Guidelines:\n';
    details.guidelines.forEach((guideline) => {
      prompt += `  - ${guideline}\n`;
    });
    prompt += '\n';
  });

  // Candidate resume
  prompt += 'CANDIDATE RESUME:\n';
  prompt += `${resumeContext}\n\n`;

  // AI analysis (if available)
  if (aiAnalysis) {
    prompt += 'RESUME ANALYSIS:\n';
    prompt += `ATS Score: ${aiAnalysis.score}/100\n`;
    prompt += `Skills: ${aiAnalysis.skills?.join(', ') || 'N/A'}\n`;
    prompt += `Experience Level: ${aiAnalysis.experienceLevel || 'N/A'}\n\n`;
  }

  // Job description (if provided)
  if (jobDescription) {
    prompt += 'TARGET JOB:\n';
    prompt += `${jobDescription}\n\n`;
  }

  // Task
  prompt += 'TASK:\n';
  prompt += 'Generate personalized interview questions based on the candidate information above.\n';
  prompt += 'Include:\n';
  prompt += `- ${QUESTION_CATEGORIES.technical.count} technical questions (varied difficulty)\n`;
  prompt += `- ${QUESTION_CATEGORIES.behavioral.count} behavioral questions (different categories)\n`;
  prompt += `- ${QUESTION_CATEGORIES.projectBased.count} project-based questions (from actual resume projects)\n`;
  prompt += `- ${QUESTION_CATEGORIES.followUp.count} follow-up questions (to probe deeper)\n\n`;
  prompt += 'Each question must include an ideal answer to help the candidate prepare.\n\n';

  // JSON format
  prompt += 'Your response MUST be in this EXACT JSON format (no markdown, no code blocks):\n';
  prompt += JSON.stringify(JSON_STRUCTURE, null, 2);

  return prompt;
};

export default {
  SYSTEM_ROLE,
  RESPONSIBILITIES,
  CRITICAL_RULES,
  QUESTION_CATEGORIES,
  JSON_STRUCTURE,
  buildInterviewPrompt,
};
