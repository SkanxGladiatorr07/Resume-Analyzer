/**
 * Resume Rewrite Prompts
 * Centralized prompt templates for resume rewriting
 */

export const SYSTEM_ROLE = 'professional resume writer and career coach';

export const RESPONSIBILITIES = [
  'Rewrite resume content to be clear, impactful, and ATS-friendly',
  'Maintain factual accuracy - never invent experience',
  'Match the specified tone and section type',
  'Improve clarity and conciseness',
  'Highlight achievements with measurable impact where explicitly stated',
  'Use strong action verbs and professional language',
];

export const CRITICAL_RULES = [
  'Never fabricate achievements, metrics, or responsibilities',
  'Preserve all factual information from the original',
  'Keep rewritten content approximately the same length (±20%)',
  'Use bullet points for experience/project sections',
  'Avoid clichés and generic phrases',
  'Ensure all claims are supported by the original content',
  'Be specific and concrete',
];

export const TONE_GUIDELINES = {
  professional: {
    description: 'Polished, formal, and corporate-appropriate',
    characteristics: [
      'Use formal business language',
      'Focus on achievements and outcomes',
      'Maintain professional distance',
      'Emphasize collaboration and results',
    ],
  },
  technical: {
    description: 'Precise, technical, and detail-oriented',
    characteristics: [
      'Use industry-specific terminology',
      'Highlight technical skills and tools',
      'Focus on implementation details',
      'Emphasize problem-solving and innovation',
    ],
  },
  leadership: {
    description: 'Strategic, results-driven, and influential',
    characteristics: [
      'Emphasize leadership and initiative',
      'Highlight team management and mentoring',
      'Focus on strategic impact',
      'Use strong action verbs (Led, Drove, Spearheaded)',
    ],
  },
  concise: {
    description: 'Brief, direct, and impactful',
    characteristics: [
      'Eliminate unnecessary words',
      'Focus on key achievements',
      'Use short, punchy sentences',
      'Prioritize impact over detail',
    ],
  },
};

export const SECTION_GUIDELINES = {
  summary: {
    description: 'Professional summary or objective statement',
    tips: [
      'Start with years of experience and role',
      'Highlight 2-3 key strengths',
      'Mention industry or domain expertise',
      'Keep to 2-4 sentences',
    ],
  },
  experience: {
    description: 'Work experience and accomplishments',
    tips: [
      'Start each point with a strong action verb',
      'Include specific metrics when available in original',
      'Focus on impact and results',
      'Use bullet points',
      'Quantify achievements where possible',
    ],
  },
  projects: {
    description: 'Academic or personal projects',
    tips: [
      'Describe the project purpose and scope',
      'Highlight technologies and methodologies',
      'Explain your specific contributions',
      'Mention outcomes or results if available',
    ],
  },
  skills: {
    description: 'Technical and soft skills',
    tips: [
      'Group related skills together',
      'List most relevant skills first',
      'Be specific (e.g., "React.js" not "JavaScript frameworks")',
      'Include proficiency levels if relevant',
    ],
  },
};

export const JSON_STRUCTURE = {
  rewrittenContent: 'string (the rewritten content)',
  improvements: [
    'string (explanation of improvement 1)',
    'string (explanation of improvement 2)',
    'string (explanation of improvement 3)',
  ],
};

export const buildRewritePrompt = ({ section, tone, content, relatedContext }) => {
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

  // Section guidelines
  const sectionGuide = SECTION_GUIDELINES[section];
  if (sectionGuide) {
    prompt += `SECTION: ${section.toUpperCase()}\n`;
    prompt += `Description: ${sectionGuide.description}\n`;
    prompt += 'Guidelines:\n';
    sectionGuide.tips.forEach((tip) => {
      prompt += `- ${tip}\n`;
    });
    prompt += '\n';
  }

  // Tone guidelines
  const toneGuide = TONE_GUIDELINES[tone];
  if (toneGuide) {
    prompt += `TONE: ${tone.toUpperCase()}\n`;
    prompt += `Description: ${toneGuide.description}\n`;
    prompt += 'Characteristics:\n';
    toneGuide.characteristics.forEach((char) => {
      prompt += `- ${char}\n`;
    });
    prompt += '\n';
  }

  // Related context (if available)
  if (relatedContext && relatedContext.length > 0) {
    prompt += 'RELATED RESUME CONTEXT:\n';
    relatedContext.forEach((chunk) => {
      prompt += `[${chunk.sectionName}]\n${chunk.text}\n\n`;
    });
    prompt += '\n';
  }

  // Original content
  prompt += 'ORIGINAL CONTENT TO REWRITE:\n';
  prompt += `${content}\n\n`;

  // Task
  prompt += 'TASK:\n';
  prompt += `Rewrite the above ${section} content in a ${tone} tone.\n`;
  prompt += 'Focus on clarity, impact, and ATS optimization.\n';
  prompt += 'Provide 3-5 specific improvements you made.\n\n';

  // JSON format
  prompt += 'Your response MUST be in this EXACT JSON format (no markdown, no code blocks):\n';
  prompt += JSON.stringify(JSON_STRUCTURE, null, 2);

  return prompt;
};

export default {
  SYSTEM_ROLE,
  RESPONSIBILITIES,
  CRITICAL_RULES,
  TONE_GUIDELINES,
  SECTION_GUIDELINES,
  JSON_STRUCTURE,
  buildRewritePrompt,
};
