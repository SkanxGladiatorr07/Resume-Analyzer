/**
 * STAR Format Prompts
 * Centralized prompt templates for STAR bullet generation
 */

export const SYSTEM_ROLE = 'professional resume coach specializing in STAR methodology';

export const RESPONSIBILITIES = [
  'Convert experience descriptions into STAR format (Situation, Task, Action, Result)',
  'Maintain factual accuracy - never invent details',
  'Structure content clearly and logically',
  'Highlight measurable impact when explicitly stated',
  'Create compelling, ATS-friendly bullets',
];

export const CRITICAL_RULES = [
  'Never fabricate situations, tasks, actions, or results',
  'Only include information present in the original content',
  'If metrics are not in original, do NOT add them',
  'Keep the same level of detail - do not embellish',
  'Each STAR component should be clear and specific',
  'Maintain professional tone throughout',
];

export const STAR_FRAMEWORK = {
  situation: {
    description: 'The context or challenge faced',
    tips: [
      'Briefly describe the circumstances',
      'Set the scene concisely (1-2 sentences)',
      'Provide necessary background',
      'Avoid unnecessary details',
    ],
    examples: [
      'Team faced declining user engagement on mobile app',
      'Company needed to migrate legacy system to cloud',
      'Department lacked standardized testing procedures',
    ],
  },
  task: {
    description: 'Your specific responsibility or objective',
    tips: [
      'Clearly state YOUR role',
      'Define the specific goal or objective',
      'Keep it focused and specific',
      'Use first-person perspective',
    ],
    examples: [
      'Tasked with redesigning user interface to improve engagement',
      'Responsible for planning and executing the migration',
      'Assigned to develop and implement testing framework',
    ],
  },
  action: {
    description: 'The steps you took to address the task',
    tips: [
      'Use strong action verbs',
      'Be specific about what YOU did',
      'Highlight skills and tools used',
      'Show problem-solving approach',
      'Can be multiple actions in logical sequence',
    ],
    examples: [
      'Conducted user research, created wireframes, implemented A/B testing',
      'Developed migration plan, coordinated with stakeholders, automated deployment',
      'Designed test strategy, built automation framework, trained team members',
    ],
  },
  result: {
    description: 'The measurable outcome or impact',
    tips: [
      'Include metrics ONLY if in original content',
      'Highlight positive outcomes',
      'Show business impact when possible',
      'Be specific about improvements',
      'Can include qualitative and quantitative results',
    ],
    examples: [
      'Increased user engagement by 35% within 3 months',
      'Successfully migrated 100+ services with zero downtime',
      'Reduced testing time by 60%, caught 40% more bugs',
    ],
  },
};

export const JSON_STRUCTURE = {
  original: 'string (original experience text)',
  starVersion: 'string (complete STAR-formatted version)',
  breakdown: {
    situation: 'string (S component)',
    task: 'string (T component)',
    action: 'string (A component)',
    result: 'string (R component)',
  },
};

export const buildStarPrompt = ({ experience, resumeContext }) => {
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

  // STAR framework explanation
  prompt += 'STAR FRAMEWORK:\n\n';
  Object.entries(STAR_FRAMEWORK).forEach(([component, details]) => {
    prompt += `${component.toUpperCase()} - ${details.description}\n`;
    prompt += 'Guidelines:\n';
    details.tips.forEach((tip) => {
      prompt += `  - ${tip}\n`;
    });
    prompt += 'Examples:\n';
    details.examples.forEach((example) => {
      prompt += `  - ${example}\n`;
    });
    prompt += '\n';
  });

  // Resume context (if available)
  if (resumeContext && resumeContext.length > 0) {
    prompt += 'RESUME CONTEXT (for reference only):\n';
    resumeContext.forEach((chunk) => {
      prompt += `${chunk.text}\n\n`;
    });
  }

  // Original experience
  prompt += 'ORIGINAL EXPERIENCE:\n';
  prompt += `${experience}\n\n`;

  // Task
  prompt += 'TASK:\n';
  prompt += 'Convert the above experience into STAR format.\n';
  prompt += 'Break down into clear S-T-A-R components.\n';
  prompt += 'Create a polished, combined version for resume.\n';
  prompt += 'Do NOT add information not present in the original.\n\n';

  // JSON format
  prompt += 'Your response MUST be in this EXACT JSON format (no markdown, no code blocks):\n';
  prompt += JSON.stringify(JSON_STRUCTURE, null, 2);

  return prompt;
};

export default {
  SYSTEM_ROLE,
  RESPONSIBILITIES,
  CRITICAL_RULES,
  STAR_FRAMEWORK,
  JSON_STRUCTURE,
  buildStarPrompt,
};
