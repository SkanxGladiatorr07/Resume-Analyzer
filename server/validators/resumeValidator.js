/**
 * Resume Input Validation Schemas
 * Uses Joi for comprehensive input validation
 */

import Joi from 'joi';

/**
 * MongoDB ObjectId validation
 */
const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'Invalid ID format',
  });

/**
 * Resume ID parameter validation
 */
export const resumeIdSchema = Joi.object({
  id: objectIdSchema.required(),
});

/**
 * Job description validation schema
 */
export const jobDescriptionSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Job title is required',
      'string.min': 'Job title must be at least 2 characters',
      'string.max': 'Job title cannot exceed 200 characters',
    }),

  description: Joi.string()
    .trim()
    .min(50)
    .max(10000)
    .required()
    .messages({
      'string.empty': 'Job description is required',
      'string.min': 'Job description must be at least 50 characters',
      'string.max': 'Job description cannot exceed 10000 characters',
    }),

  company: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Company name must be at least 2 characters',
      'string.max': 'Company name cannot exceed 100 characters',
    }),

  location: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Location cannot exceed 100 characters',
    }),

  skills: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(100)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 100 skills',
    }),
});

/**
 * Resume analysis request validation
 */
export const analysisRequestSchema = Joi.object({
  resumeId: objectIdSchema.required(),
  analysisType: Joi.string()
    .valid('ats', 'comprehensive', 'skills', 'keywords')
    .optional()
    .messages({
      'any.only': 'Invalid analysis type',
    }),
});

/**
 * Job match request validation
 */
export const jobMatchSchema = Joi.object({
  resumeId: objectIdSchema.required(),
  jobDescriptionId: objectIdSchema.optional(),
  jobDescription: Joi.string()
    .trim()
    .min(50)
    .max(10000)
    .when('jobDescriptionId', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    })
    .messages({
      'string.empty': 'Job description is required',
      'string.min': 'Job description must be at least 50 characters',
      'string.max': 'Job description cannot exceed 10000 characters',
    }),
});

/**
 * Pagination validation schema
 */
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'originalName', 'fileSize')
    .default('createdAt')
    .optional(),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional(),
});

/**
 * Resume search validation schema
 */
export const searchSchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Search query is required',
      'string.min': 'Search query must be at least 1 character',
      'string.max': 'Search query cannot exceed 200 characters',
    }),

  fields: Joi.array()
    .items(Joi.string().valid('originalName', 'extractedText', 'skills'))
    .optional(),
});

/**
 * Resume version comparison validation
 */
export const versionCompareSchema = Joi.object({
  id: objectIdSchema.required(),
  version1: Joi.string().required(),
  version2: Joi.string().required(),
});

/**
 * Export format validation
 */
export const exportFormatSchema = Joi.object({
  format: Joi.string()
    .valid('pdf', 'docx', 'json')
    .required()
    .messages({
      'any.only': 'Format must be one of: pdf, docx, json',
    }),

  includeAnalysis: Joi.boolean()
    .default(true)
    .optional(),

  includeMatches: Joi.boolean()
    .default(true)
    .optional(),
});

/**
 * AI generation request validation
 */
export const aiGenerationSchema = Joi.object({
  resumeId: objectIdSchema.required(),
  
  type: Joi.string()
    .valid('rewrite', 'star', 'projects', 'interview', 'roadmap')
    .required()
    .messages({
      'any.only': 'Invalid generation type',
    }),

  context: Joi.string()
    .trim()
    .max(5000)
    .optional()
    .messages({
      'string.max': 'Context cannot exceed 5000 characters',
    }),

  options: Joi.object()
    .optional(),
});

export default {
  resumeIdSchema,
  jobDescriptionSchema,
  analysisRequestSchema,
  jobMatchSchema,
  paginationSchema,
  searchSchema,
  versionCompareSchema,
  exportFormatSchema,
  aiGenerationSchema,
};
