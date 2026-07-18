/**
 * AI Response Validation Schemas
 * Centralized validation schemas for all AI responses
 */

/**
 * Resume Rewrite Response Schema
 */
export const REWRITE_SCHEMA = {
  required: ['rewrittenContent', 'improvements'],
  types: {
    rewrittenContent: 'string',
    improvements: 'array',
  },
  arrayLengths: {
    improvements: { min: 2, max: 10 },
  },
};

/**
 * STAR Response Schema
 */
export const STAR_SCHEMA = {
  required: ['original', 'starVersion', 'breakdown'],
  types: {
    original: 'string',
    starVersion: 'string',
    breakdown: 'object',
  },
  nested: {
    breakdown: {
      required: ['situation', 'task', 'action', 'result'],
      types: {
        situation: 'string',
        task: 'string',
        action: 'string',
        result: 'string',
      },
    },
  },
};

/**
 * Interview Questions Response Schema
 */
export const INTERVIEW_SCHEMA = {
  required: ['technical', 'behavioral', 'projectBased', 'followUp'],
  types: {
    technical: 'array',
    behavioral: 'array',
    projectBased: 'array',
    followUp: 'array',
  },
  arrayLengths: {
    technical: { min: 3, max: 7 },
    behavioral: { min: 3, max: 7 },
    projectBased: { min: 2, max: 5 },
    followUp: { min: 3, max: 6 },
  },
  nested: {
    technical: {
      required: ['question', 'difficulty', 'topic', 'idealAnswer'],
      types: {
        question: 'string',
        difficulty: 'string',
        topic: 'string',
        idealAnswer: 'string',
      },
    },
    behavioral: {
      required: ['question', 'category', 'idealAnswer'],
      types: {
        question: 'string',
        category: 'string',
        idealAnswer: 'string',
      },
    },
    projectBased: {
      required: ['question', 'project', 'idealAnswer'],
      types: {
        question: 'string',
        project: 'string',
        idealAnswer: 'string',
      },
    },
    followUp: {
      required: ['question', 'context', 'idealAnswer'],
      types: {
        question: 'string',
        context: 'string',
        idealAnswer: 'string',
      },
    },
  },
};

/**
 * Project Suggestions Response Schema
 */
export const PROJECTS_SCHEMA = {
  required: ['projects'],
  types: {
    projects: 'array',
  },
  arrayLengths: {
    projects: { min: 3, max: 7 },
  },
  nested: {
    projects: {
      required: [
        'name',
        'description',
        'difficulty',
        'technologies',
        'learningOutcomes',
        'estimatedDuration',
        'keyFeatures',
      ],
      types: {
        name: 'string',
        description: 'string',
        difficulty: 'string',
        technologies: 'array',
        learningOutcomes: 'array',
        estimatedDuration: 'string',
        keyFeatures: 'array',
      },
      arrayLengths: {
        technologies: { min: 2, max: 10 },
        learningOutcomes: { min: 2, max: 6 },
        keyFeatures: { min: 3, max: 8 },
      },
    },
  },
};

/**
 * Roadmap Response Schema (Learning and Career)
 */
export const ROADMAP_SCHEMA = {
  required: ['overview', 'phases', 'estimatedTimeline', 'keyMilestones', 'recommendations'],
  types: {
    overview: 'string',
    phases: 'array',
    estimatedTimeline: 'string',
    keyMilestones: 'array',
    recommendations: 'array',
  },
  arrayLengths: {
    phases: { min: 2, max: 6 },
    keyMilestones: { min: 2, max: 10 },
    recommendations: { min: 2, max: 8 },
  },
  nested: {
    phases: {
      required: ['phase', 'duration', 'topics', 'resources', 'milestones'],
      types: {
        phase: 'string',
        duration: 'string',
        topics: 'array',
        resources: 'array',
        milestones: 'array',
      },
      arrayLengths: {
        topics: { min: 2, max: 10 },
        resources: { min: 1, max: 10 },
        milestones: { min: 2, max: 8 },
      },
      nested: {
        resources: {
          required: ['title', 'type', 'url', 'description'],
          types: {
            title: 'string',
            type: 'string',
            url: 'string',
            description: 'string',
          },
        },
      },
    },
  },
};

/**
 * Get schema by feature name
 * @param {string} feature - Feature name
 * @returns {Object|null} Schema or null
 */
export const getSchemaByFeature = (feature) => {
  const schemas = {
    rewrite: REWRITE_SCHEMA,
    star: STAR_SCHEMA,
    interview: INTERVIEW_SCHEMA,
    projects: PROJECTS_SCHEMA,
    roadmap: ROADMAP_SCHEMA,
    learning: ROADMAP_SCHEMA,
    career: ROADMAP_SCHEMA,
  };

  return schemas[feature] || null;
};

export default {
  REWRITE_SCHEMA,
  STAR_SCHEMA,
  INTERVIEW_SCHEMA,
  PROJECTS_SCHEMA,
  ROADMAP_SCHEMA,
  getSchemaByFeature,
};
