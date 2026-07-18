/**
 * Roadmap Generation Prompts
 * Centralized prompt templates for learning and career roadmaps
 */

export const LEARNING_SYSTEM_ROLE = 'expert learning advisor and technical mentor';
export const CAREER_SYSTEM_ROLE = 'expert career advisor and leadership coach';

export const LEARNING_RESPONSIBILITIES = [
  'Create structured, achievable learning paths for technical skill development',
  'Recommend high-quality, accessible resources',
  'Set realistic timelines and measurable milestones',
  'Build on existing knowledge systematically',
  'Focus on practical, applicable skills',
];

export const CAREER_RESPONSIBILITIES = [
  'Map realistic career progression paths',
  'Identify key skills and experiences needed for advancement',
  'Suggest specific, actionable steps and milestones',
  'Account for current experience level and market realities',
  'Provide strategic career advice and development guidance',
];

export const LEARNING_CRITICAL_RULES = [
  'Learning path must be realistic and achievable within timeframe',
  'Resources should be free or widely accessible',
  'Each phase should have clear learning objectives',
  'Milestones should be measurable and specific',
  'Progression should be logical and build on previous phases',
  'Avoid recommending paid certifications unless industry-standard',
];

export const CAREER_CRITICAL_RULES = [
  'Career progression must be realistic given experience level',
  'Consider industry standards and typical advancement timelines',
  'Account for current skills and identify gaps',
  'Suggest concrete, actionable steps',
  'Include both technical and soft skills development',
  'Address leadership and strategic thinking for senior roles',
];

export const ROADMAP_PHASES = {
  learning: {
    description: 'Structured learning phases with resources',
    components: [
      'Phase name and duration',
      'Topics to learn',
      'Curated resources (courses, books, articles, videos, projects)',
      'Milestones to achieve',
    ],
    count: '3-4 phases',
  },
  career: {
    description: 'Career progression phases',
    components: [
      'Phase name and duration',
      'Skills to develop',
      'Experiences to gain',
      'Books and courses for growth',
      'Milestones and achievements',
    ],
    count: '3-5 phases',
  },
};

export const RESOURCE_TYPES = {
  course: 'Online courses (Coursera, Udemy, freeCodeCamp, etc.)',
  book: 'Technical or professional books',
  article: 'Blog posts, documentation, tutorials',
  video: 'YouTube tutorials, conference talks',
  project: 'Hands-on practice projects',
};

export const LEARNING_JSON_STRUCTURE = {
  overview: 'string (2-3 sentence roadmap overview)',
  phases: [
    {
      phase: 'string (Phase name)',
      duration: 'string (Time estimate)',
      topics: ['Array of topics to learn'],
      resources: [
        {
          title: 'string (Resource name)',
          type: 'course|book|article|video|project',
          url: 'string (Resource URL)',
          description: 'string (Why this resource is valuable)',
        },
      ],
      milestones: ['Array of measurable milestones'],
    },
  ],
  estimatedTimeline: 'string (Overall timeline)',
  keyMilestones: ['Array of major achievements'],
  recommendations: ['Array of strategic advice'],
};

export const CAREER_JSON_STRUCTURE = {
  overview: 'string (2-3 sentence career roadmap overview)',
  phases: [
    {
      phase: 'string (Phase name and target role)',
      duration: 'string (Time estimate)',
      topics: ['Array of skills/experiences to develop'],
      resources: [
        {
          title: 'string (Resource name)',
          type: 'course|book|article|video|project',
          url: 'string (Resource URL)',
          description: 'string (How this helps career progression)',
        },
      ],
      milestones: ['Array of career milestones'],
    },
  ],
  estimatedTimeline: 'string (Overall timeline)',
  keyMilestones: ['Array of major career achievements'],
  recommendations: ['Array of strategic career advice'],
};

export const buildLearningRoadmapPrompt = ({ currentSkills, targetRole, timeframe }) => {
  let prompt = '';

  // System role
  prompt += `You are an expert ${LEARNING_SYSTEM_ROLE}.\n\n`;

  // Responsibilities
  prompt += 'RESPONSIBILITIES:\n';
  LEARNING_RESPONSIBILITIES.forEach((resp, idx) => {
    prompt += `${idx + 1}. ${resp}\n`;
  });
  prompt += '\n';

  // Critical rules
  prompt += 'CRITICAL RULES:\n';
  LEARNING_CRITICAL_RULES.forEach((rule) => {
    prompt += `- ${rule}\n`;
  });
  prompt += '\n';

  // Resource types
  prompt += 'RESOURCE TYPES:\n';
  Object.entries(RESOURCE_TYPES).forEach(([type, desc]) => {
    prompt += `- ${type}: ${desc}\n`;
  });
  prompt += '\n';

  // Current skills
  prompt += 'CURRENT SKILLS:\n';
  if (currentSkills && currentSkills.length > 0) {
    currentSkills.forEach((skill) => {
      prompt += `- ${skill}\n`;
    });
  } else {
    prompt += 'None specified (beginner level)\n';
  }
  prompt += '\n';

  // Target role
  prompt += 'TARGET ROLE:\n';
  prompt += `${targetRole}\n\n`;

  // Timeframe
  prompt += 'TIMEFRAME:\n';
  prompt += `${timeframe}\n\n`;

  // Task
  prompt += 'TASK:\n';
  prompt += 'Generate a structured learning roadmap that:\n';
  prompt += '1. Builds on existing skills\n';
  prompt += '2. Fills gaps needed for target role\n';
  prompt += '3. Fits within the specified timeframe\n';
  prompt += '4. Has 3-4 clear phases with progression\n';
  prompt += '5. Includes actionable, accessible resources\n';
  prompt += '6. Contains measurable milestones\n\n';
  prompt += 'Focus on free/accessible resources. Provide real URLs when possible.\n\n';

  // JSON format
  prompt += 'Your response MUST be in this EXACT JSON format (no markdown, no code blocks):\n';
  prompt += JSON.stringify(LEARNING_JSON_STRUCTURE, null, 2);

  return prompt;
};

export const buildCareerRoadmapPrompt = ({ currentRole, targetCareerRole, yearsOfExperience }) => {
  let prompt = '';

  // System role
  prompt += `You are an expert ${CAREER_SYSTEM_ROLE}.\n\n`;

  // Responsibilities
  prompt += 'RESPONSIBILITIES:\n';
  CAREER_RESPONSIBILITIES.forEach((resp, idx) => {
    prompt += `${idx + 1}. ${resp}\n`;
  });
  prompt += '\n';

  // Critical rules
  prompt += 'CRITICAL RULES:\n';
  CAREER_CRITICAL_RULES.forEach((rule) => {
    prompt += `- ${rule}\n`;
  });
  prompt += '\n';

  // Resource types
  prompt += 'RESOURCE TYPES:\n';
  Object.entries(RESOURCE_TYPES).forEach(([type, desc]) => {
    prompt += `- ${type}: ${desc}\n`;
  });
  prompt += '\n';

  // Current role
  prompt += 'CURRENT ROLE:\n';
  prompt += `${currentRole}\n\n`;

  // Target role
  prompt += 'TARGET ROLE:\n';
  prompt += `${targetCareerRole}\n\n`;

  // Experience
  prompt += 'YEARS OF EXPERIENCE:\n';
  prompt += `${yearsOfExperience} years\n\n`;

  // Task
  prompt += 'TASK:\n';
  prompt += 'Generate a career progression roadmap that:\n';
  prompt += '1. Maps realistic career progression from current to target role\n';
  prompt += '2. Identifies required skills and experiences\n';
  prompt += '3. Suggests concrete actions and milestones\n';
  prompt += '4. Accounts for current experience level\n';
  prompt += '5. Has 3-5 phases showing progression\n';
  prompt += '6. Includes both technical and leadership development\n\n';
  prompt += 'Consider typical career timelines and industry expectations.\n\n';

  // JSON format
  prompt += 'Your response MUST be in this EXACT JSON format (no markdown, no code blocks):\n';
  prompt += JSON.stringify(CAREER_JSON_STRUCTURE, null, 2);

  return prompt;
};

export default {
  LEARNING_SYSTEM_ROLE,
  CAREER_SYSTEM_ROLE,
  LEARNING_RESPONSIBILITIES,
  CAREER_RESPONSIBILITIES,
  LEARNING_CRITICAL_RULES,
  CAREER_CRITICAL_RULES,
  ROADMAP_PHASES,
  RESOURCE_TYPES,
  LEARNING_JSON_STRUCTURE,
  CAREER_JSON_STRUCTURE,
  buildLearningRoadmapPrompt,
  buildCareerRoadmapPrompt,
};
