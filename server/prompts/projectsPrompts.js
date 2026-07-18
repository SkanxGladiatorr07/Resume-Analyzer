/**
 * Project Suggestions Prompts
 * Centralized prompt templates for project suggestion generation
 */

export const SYSTEM_ROLE = 'expert software development mentor and project advisor';

export const RESPONSIBILITIES = [
  'Suggest portfolio-worthy projects tailored to candidate skills and goals',
  'Ensure projects are practical, achievable, and demonstrate real-world applications',
  'Match difficulty to current skill level while introducing new technologies',
  'Provide clear learning outcomes and implementation guidance',
  'Focus on projects that enhance employability',
];

export const CRITICAL_RULES = [
  'Projects must be realistic and achievable within stated timeframes',
  'Each project should teach 2-3 new concepts or technologies',
  'Technologies should align with career goals and missing skills',
  'Difficulty progression should be logical',
  'All projects must be portfolio-worthy',
  'Avoid overly complex or vague projects',
];

export const DIFFICULTY_LEVELS = {
  beginner: {
    description: 'Foundational projects for learning basics',
    characteristics: [
      'Duration: 1-2 weeks',
      'Focus: Core concepts and fundamentals',
      'Complexity: Single service, basic features',
      'Tech stack: 2-4 technologies',
      'Good for: Building confidence and understanding basics',
    ],
    count: 2,
  },
  intermediate: {
    description: 'Projects with moderate complexity and multiple features',
    characteristics: [
      'Duration: 3-4 weeks',
      'Focus: Integration and best practices',
      'Complexity: Multiple features, some integrations',
      'Tech stack: 4-6 technologies',
      'Good for: Demonstrating competency and problem-solving',
    ],
    count: 2,
  },
  advanced: {
    description: 'Complex projects demonstrating senior-level skills',
    characteristics: [
      'Duration: 6-8 weeks',
      'Focus: Architecture, scalability, production-ready features',
      'Complexity: Microservices, advanced patterns, multiple components',
      'Tech stack: 6-8 technologies',
      'Good for: Showcasing expertise and system design skills',
    ],
    count: 1,
  },
};

export const PROJECT_STRUCTURE = {
  name: 'Clear, descriptive project name',
  description: 'Detailed 2-3 sentence overview explaining purpose and scope',
  difficulty: 'beginner|intermediate|advanced',
  technologies: ['Array of 5-7 specific technologies'],
  learningOutcomes: ['Array of 3-4 key skills/concepts learned'],
  estimatedDuration: 'Realistic time commitment (e.g., "3-4 weeks")',
  keyFeatures: ['Array of 4-5 main features to implement'],
};

export const JSON_STRUCTURE = {
  projects: [PROJECT_STRUCTURE],
};

export const buildProjectsPrompt = ({ existingSkills, missingSkills, careerGoal }) => {
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

  // Difficulty levels
  prompt += 'DIFFICULTY LEVELS:\n\n';
  Object.entries(DIFFICULTY_LEVELS).forEach(([level, details]) => {
    prompt += `${level.toUpperCase()} (${details.count} projects)\n`;
    prompt += `Description: ${details.description}\n`;
    prompt += 'Characteristics:\n';
    details.characteristics.forEach((char) => {
      prompt += `  - ${char}\n`;
    });
    prompt += '\n';
  });

  // Existing skills
  prompt += 'EXISTING SKILLS:\n';
  if (existingSkills && existingSkills.length > 0) {
    existingSkills.forEach((skill) => {
      prompt += `- ${skill}\n`;
    });
  } else {
    prompt += 'None specified\n';
  }
  prompt += '\n';

  // Missing skills
  prompt += 'SKILLS TO DEVELOP:\n';
  if (missingSkills && missingSkills.length > 0) {
    missingSkills.forEach((skill) => {
      prompt += `- ${skill}\n`;
    });
  } else {
    prompt += 'None specified\n';
  }
  prompt += '\n';

  // Career goal
  if (careerGoal) {
    prompt += 'CAREER GOAL:\n';
    prompt += `${careerGoal}\n\n`;
  }

  // Task
  prompt += 'TASK:\n';
  prompt += 'Generate 5 portfolio-worthy project suggestions that:\n';
  prompt += '1. Build on existing skills\n';
  prompt += '2. Teach missing/target skills\n';
  prompt += '3. Align with career goals\n';
  prompt += '4. Progress in difficulty (2 beginner, 2 intermediate, 1 advanced)\n';
  prompt += '5. Are achievable and practical\n';
  prompt += '6. Can be showcased in a portfolio\n\n';
  prompt += 'Each project should have clear learning outcomes and realistic scope.\n\n';

  // JSON format
  prompt += 'Your response MUST be in this EXACT JSON format (no markdown, no code blocks):\n';
  prompt += JSON.stringify(JSON_STRUCTURE, null, 2);

  return prompt;
};

export default {
  SYSTEM_ROLE,
  RESPONSIBILITIES,
  CRITICAL_RULES,
  DIFFICULTY_LEVELS,
  PROJECT_STRUCTURE,
  JSON_STRUCTURE,
  buildProjectsPrompt,
};
