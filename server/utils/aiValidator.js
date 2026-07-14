/**
 * AI Response Validator
 * Comprehensive validation and sanitization for AI-generated content
 */

/**
 * Validate structured analysis response from AI
 * @param {Object} data - AI response data
 * @returns {Object} Validation result with detailed errors
 */
export const validateStructuredAnalysis = (data) => {
  const errors = [];
  const warnings = [];

  // Validate atsScore
  if (typeof data.atsScore !== 'number') {
    errors.push('atsScore must be a number');
  } else {
    if (data.atsScore < 0 || data.atsScore > 100) {
      errors.push('atsScore must be between 0 and 100');
    }
    if (!Number.isInteger(data.atsScore)) {
      warnings.push('atsScore should be an integer (will be rounded)');
    }
  }

  // Validate summary
  if (typeof data.summary !== 'string') {
    errors.push('summary must be a string');
  } else {
    const trimmedSummary = data.summary.trim();
    if (trimmedSummary.length === 0) {
      errors.push('summary cannot be empty');
    } else if (trimmedSummary.length < 10) {
      warnings.push('summary is very short (less than 10 characters)');
    } else if (trimmedSummary.length > 1000) {
      warnings.push('summary is very long (will be truncated to 1000 characters)');
    }
  }

  // Validate array fields
  const arrayFields = [
    { name: 'strengths', minItems: 1, maxItems: 20 },
    { name: 'weaknesses', minItems: 1, maxItems: 20 },
    { name: 'missingSkills', minItems: 0, maxItems: 20 },
    { name: 'grammarFeedback', minItems: 0, maxItems: 20 },
    { name: 'formattingFeedback', minItems: 0, maxItems: 20 },
    { name: 'suggestions', minItems: 1, maxItems: 20 },
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(data[field.name])) {
      errors.push(`${field.name} must be an array`);
      continue;
    }

    // Check array length
    if (data[field.name].length < field.minItems) {
      warnings.push(`${field.name} has fewer than ${field.minItems} items`);
    }
    if (data[field.name].length > field.maxItems) {
      warnings.push(`${field.name} has more than ${field.maxItems} items (will be truncated)`);
    }

    // Check array items are strings
    const nonStrings = data[field.name].filter(item => typeof item !== 'string');
    if (nonStrings.length > 0) {
      errors.push(`${field.name} must contain only strings`);
      continue;
    }

    // Check for empty strings
    const emptyItems = data[field.name].filter(item => !item.trim());
    if (emptyItems.length > 0) {
      warnings.push(`${field.name} contains empty strings (will be filtered)`);
    }

    // Check item length
    const longItems = data[field.name].filter(item => item.length > 500);
    if (longItems.length > 0) {
      warnings.push(`${field.name} contains very long items (will be truncated to 500 chars)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Sanitize structured analysis data
 * @param {Object} data - Raw AI response
 * @returns {Object} Sanitized and normalized data
 */
export const sanitizeStructuredAnalysis = (data) => {
  // Sanitize atsScore
  let atsScore = Number(data.atsScore);
  if (isNaN(atsScore)) atsScore = 0;
  atsScore = Math.round(Math.max(0, Math.min(100, atsScore)));

  // Sanitize summary
  let summary = String(data.summary || '').trim();
  if (summary.length > 1000) {
    summary = summary.substring(0, 1000) + '...';
  }

  // Sanitize array fields
  const sanitizeArray = (arr, maxLength = 20) => {
    if (!Array.isArray(arr)) return [];
    
    return arr
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => {
        let sanitized = item.trim();
        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ');
        // Truncate if too long
        if (sanitized.length > 500) {
          sanitized = sanitized.substring(0, 500) + '...';
        }
        return sanitized;
      })
      .slice(0, maxLength); // Limit array size
  };

  return {
    atsScore,
    summary,
    strengths: sanitizeArray(data.strengths),
    weaknesses: sanitizeArray(data.weaknesses),
    missingSkills: sanitizeArray(data.missingSkills),
    grammarFeedback: sanitizeArray(data.grammarFeedback),
    formattingFeedback: sanitizeArray(data.formattingFeedback),
    suggestions: sanitizeArray(data.suggestions),
  };
};

/**
 * Calculate confidence score for AI response
 * @param {Object} data - Sanitized analysis data
 * @returns {number} Confidence score (0-100)
 */
export const calculateAnalysisConfidence = (data) => {
  let confidence = 100;

  // Deduct for missing or poor quality data
  if (!data.summary || data.summary.length < 20) {
    confidence -= 15;
  }

  if (!data.strengths || data.strengths.length < 2) {
    confidence -= 10;
  }

  if (!data.weaknesses || data.weaknesses.length < 2) {
    confidence -= 10;
  }

  if (!data.suggestions || data.suggestions.length < 2) {
    confidence -= 10;
  }

  // Check for generic/low-quality responses
  const genericPhrases = [
    'needs improvement',
    'could be better',
    'more details',
    'not specified',
    'n/a',
    'none',
  ];

  const allText = [
    data.summary,
    ...data.strengths,
    ...data.weaknesses,
    ...data.suggestions,
  ].join(' ').toLowerCase();

  const genericCount = genericPhrases.filter(phrase => 
    allText.includes(phrase)
  ).length;

  if (genericCount > 3) {
    confidence -= 15;
  } else if (genericCount > 1) {
    confidence -= 5;
  }

  // Check ATS score validity
  if (data.atsScore === 0 || data.atsScore === 100) {
    confidence -= 5; // Suspicious perfect or zero scores
  }

  return Math.max(0, Math.min(100, confidence));
};

/**
 * Validate job description (for future job matching feature)
 * @param {string} jobDescription - Job description text
 * @returns {Object} Validation result
 */
export const validateJobDescription = (jobDescription) => {
  const errors = [];
  const warnings = [];

  if (typeof jobDescription !== 'string') {
    errors.push('Job description must be a string');
    return { valid: false, errors, warnings };
  }

  const trimmed = jobDescription.trim();

  if (trimmed.length === 0) {
    errors.push('Job description cannot be empty');
  } else if (trimmed.length < 50) {
    warnings.push('Job description is very short (less than 50 characters)');
  } else if (trimmed.length > 10000) {
    warnings.push('Job description is very long (will be truncated to 10000 characters)');
  }

  // Check for common required sections
  const hasRequirements = /requirements?|qualifications?|skills?/i.test(trimmed);
  const hasResponsibilities = /responsibilit(y|ies)|duties|role/i.test(trimmed);

  if (!hasRequirements && !hasResponsibilities) {
    warnings.push('Job description seems incomplete (missing requirements or responsibilities)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Sanitize job description
 * @param {string} jobDescription - Raw job description
 * @returns {string} Sanitized job description
 */
export const sanitizeJobDescription = (jobDescription) => {
  if (typeof jobDescription !== 'string') return '';

  let sanitized = jobDescription.trim();
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Remove special characters that might cause issues
  sanitized = sanitized.replace(/[^\w\s.,;:!?()\-\[\]{}'"\/\\@#$%&*+=<>]/g, '');
  
  // Truncate if too long
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  return sanitized;
};

/**
 * Validate AI response structure (generic)
 * @param {Object} data - AI response
 * @param {Array} requiredFields - List of required fields
 * @returns {Object} Validation result
 */
export const validateAIResponse = (data, requiredFields = []) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('AI response must be an object');
    return { valid: false, errors };
  }

  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check if AI response contains harmful content
 * @param {Object} data - AI response data
 * @returns {Object} Safety check result
 */
export const checkContentSafety = (data) => {
  const issues = [];

  // List of patterns to check
  const unsafePatterns = [
    /\b(password|credit card|social security|ssn)\b/i,
    /\b(kill|bomb|weapon|attack)\b/i,
    /\b(hack|exploit|malware|virus)\b/i,
  ];

  // Combine all text fields
  const allText = JSON.stringify(data).toLowerCase();

  for (const pattern of unsafePatterns) {
    if (pattern.test(allText)) {
      issues.push(`Content contains potentially unsafe pattern: ${pattern.source}`);
    }
  }

  return {
    safe: issues.length === 0,
    issues,
  };
};

/**
 * Estimate token count for prompt (approximate)
 * Used to optimize API usage
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
/**
 * Validate job match response structure
 * Enhanced validation with detailed checks
 * @param {Object} data - Job match data to validate
 * @returns {Object} Validation result with detailed errors and quality metrics
 */
export const validateJobMatch = (data) => {
  const errors = [];
  const warnings = [];
  const qualityMetrics = {
    completeness: 100,
    specificity: 100,
    consistency: 100,
  };

  // Validate matchScore
  if (typeof data.matchScore !== 'number') {
    errors.push('matchScore must be a number');
    qualityMetrics.completeness -= 20;
  } else {
    if (data.matchScore < 0 || data.matchScore > 100) {
      errors.push('matchScore must be between 0 and 100');
    }
    if (!Number.isInteger(data.matchScore)) {
      warnings.push('matchScore should be an integer (will be rounded)');
    }
    // Check for suspicious scores
    if (data.matchScore === 0 || data.matchScore === 100) {
      warnings.push('Extreme match score detected - verify accuracy');
      qualityMetrics.consistency -= 10;
    }
  }

  // Validate summary
  if (typeof data.summary !== 'string') {
    errors.push('summary must be a string');
    qualityMetrics.completeness -= 15;
  } else {
    const trimmedSummary = data.summary.trim();
    if (trimmedSummary.length === 0) {
      errors.push('summary cannot be empty');
      qualityMetrics.completeness -= 15;
    } else if (trimmedSummary.length < 20) {
      warnings.push('summary is very short (less than 20 characters) - may lack detail');
      qualityMetrics.specificity -= 15;
    } else if (trimmedSummary.length > 1000) {
      warnings.push('summary is very long (will be truncated to 1000 characters)');
    }
    
    // Check for generic summary
    const genericPhrases = ['good fit', 'decent match', 'could work', 'okay match'];
    if (genericPhrases.some(phrase => trimmedSummary.toLowerCase().includes(phrase))) {
      warnings.push('summary contains generic phrases - may lack specificity');
      qualityMetrics.specificity -= 10;
    }
  }

  // Validate array fields with enhanced checks
  const arrayFields = [
    { name: 'matchingSkills', minItems: 2, maxItems: 20, required: true },
    { name: 'missingTechnicalSkills', minItems: 0, maxItems: 20, required: false },
    { name: 'missingSoftSkills', minItems: 0, maxItems: 20, required: false },
    { name: 'missingKeywords', minItems: 0, maxItems: 20, required: false },
    { name: 'strengths', minItems: 2, maxItems: 20, required: true },
    { name: 'recommendations', minItems: 3, maxItems: 20, required: true },
    { name: 'atsOptimizationTips', minItems: 2, maxItems: 20, required: true },
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(data[field.name])) {
      errors.push(`${field.name} must be an array`);
      qualityMetrics.completeness -= 10;
      continue;
    }

    const items = data[field.name];

    // Check array length
    if (field.required && items.length < field.minItems) {
      errors.push(`${field.name} must have at least ${field.minItems} items`);
      qualityMetrics.completeness -= 10;
    } else if (items.length < field.minItems) {
      warnings.push(`${field.name} has fewer than ${field.minItems} items (recommended minimum)`);
      qualityMetrics.completeness -= 5;
    }
    
    if (items.length > field.maxItems) {
      warnings.push(`${field.name} has more than ${field.maxItems} items (will be truncated)`);
    }

    // Check array items are strings
    const nonStrings = items.filter(item => typeof item !== 'string');
    if (nonStrings.length > 0) {
      errors.push(`${field.name} must contain only strings`);
      continue;
    }

    // Check for empty strings
    const emptyItems = items.filter(item => !item.trim());
    if (emptyItems.length > 0) {
      warnings.push(`${field.name} contains ${emptyItems.length} empty strings (will be filtered)`);
      qualityMetrics.completeness -= 5;
    }

    // Check item length and specificity
    const shortItems = items.filter(item => item.trim().length < 10);
    if (shortItems.length > items.length / 2) {
      warnings.push(`${field.name} has many very short items - may lack detail`);
      qualityMetrics.specificity -= 10;
    }

    const longItems = items.filter(item => item.length > 500);
    if (longItems.length > 0) {
      warnings.push(`${field.name} contains ${longItems.length} very long items (will be truncated to 500 chars)`);
    }

    // Check for generic content
    const genericTerms = ['etc', 'and more', 'various', 'multiple'];
    const genericItems = items.filter(item => 
      genericTerms.some(term => item.toLowerCase().includes(term))
    );
    if (genericItems.length > 0) {
      warnings.push(`${field.name} contains generic items - may lack specificity`);
      qualityMetrics.specificity -= 5;
    }

    // Check for duplicate items
    const uniqueItems = new Set(items.map(item => item.toLowerCase().trim()));
    if (uniqueItems.size < items.length) {
      warnings.push(`${field.name} contains duplicate items`);
      qualityMetrics.consistency -= 5;
    }
  }

  // Cross-field validation
  if (data.matchScore > 80 && Array.isArray(data.missingTechnicalSkills) && 
      data.missingTechnicalSkills.length > 5) {
    warnings.push('High match score but many missing technical skills - verify consistency');
    qualityMetrics.consistency -= 10;
  }

  if (data.matchScore < 40 && Array.isArray(data.matchingSkills) && 
      data.matchingSkills.length > 10) {
    warnings.push('Low match score but many matching skills - verify consistency');
    qualityMetrics.consistency -= 10;
  }

  // Calculate overall quality score
  const overallQuality = Math.round(
    (qualityMetrics.completeness + qualityMetrics.specificity + qualityMetrics.consistency) / 3
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    qualityMetrics: {
      ...qualityMetrics,
      overall: overallQuality,
    },
  };
};

/**
 * Sanitize job match data
 * @param {Object} data - Raw job match response
 * @returns {Object} Sanitized and normalized data
 */
export const sanitizeJobMatch = (data) => {
  // Sanitize matchScore
  let matchScore = Number(data.matchScore);
  if (isNaN(matchScore)) matchScore = 0;
  matchScore = Math.round(Math.max(0, Math.min(100, matchScore)));

  // Sanitize summary
  let summary = String(data.summary || '').trim();
  if (summary.length > 1000) {
    summary = summary.substring(0, 1000) + '...';
  }

  // Sanitize array fields
  const sanitizeArray = (arr, maxLength = 20) => {
    if (!Array.isArray(arr)) return [];
    
    return arr
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => {
        let sanitized = item.trim();
        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ');
        // Truncate if too long
        if (sanitized.length > 500) {
          sanitized = sanitized.substring(0, 500) + '...';
        }
        return sanitized;
      })
      .slice(0, maxLength); // Limit array size
  };

  return {
    matchScore,
    summary,
    matchingSkills: sanitizeArray(data.matchingSkills),
    missingTechnicalSkills: sanitizeArray(data.missingTechnicalSkills),
    missingSoftSkills: sanitizeArray(data.missingSoftSkills),
    missingKeywords: sanitizeArray(data.missingKeywords),
    strengths: sanitizeArray(data.strengths),
    recommendations: sanitizeArray(data.recommendations),
    atsOptimizationTips: sanitizeArray(data.atsOptimizationTips),
  };
};

/**
 * Calculate confidence score for job match
 * @param {Object} data - Sanitized job match data
 * @returns {number} Confidence score (0-100)
 */
export const calculateJobMatchConfidence = (data) => {
  let confidence = 100;

  // Deduct for missing or poor quality data
  if (!data.summary || data.summary.length < 20) {
    confidence -= 15;
  }

  if (!data.strengths || data.strengths.length < 2) {
    confidence -= 10;
  }

  if (!data.recommendations || data.recommendations.length < 2) {
    confidence -= 10;
  }

  if (!data.matchingSkills || data.matchingSkills.length === 0) {
    confidence -= 10;
  }

  // Check for generic/low-quality responses
  const genericPhrases = [
    'needs improvement',
    'could be better',
    'more details',
    'not specified',
    'n/a',
    'none',
  ];

  const allText = [
    data.summary,
    ...data.strengths,
    ...data.recommendations,
    ...data.matchingSkills,
  ].join(' ').toLowerCase();

  const genericCount = genericPhrases.filter(phrase => 
    allText.includes(phrase)
  ).length;

  if (genericCount > 3) {
    confidence -= 15;
  } else if (genericCount > 1) {
    confidence -= 5;
  }

  // Check match score validity
  if (data.matchScore === 0 || data.matchScore === 100) {
    confidence -= 5; // Suspicious perfect or zero scores
  }

  return Math.max(0, Math.min(100, confidence));
};

export const estimateTokenCount = (text) => {
  if (!text || typeof text !== 'string') return 0;
  
  // Rough estimation: ~4 characters per token
  // This is approximate for English text
  const words = text.split(/\s+/).length;
  const chars = text.length;
  
  // Average between word count and char/4
  return Math.ceil((words + chars / 4) / 2);
};

/**
 * Check if prompt is too large for API
 * @param {string} prompt - Prompt text
 * @param {number} maxTokens - Maximum allowed tokens
 * @returns {Object} Check result
 */
export const checkPromptSize = (prompt, maxTokens = 30000) => {
  const estimatedTokens = estimateTokenCount(prompt);
  
  return {
    withinLimit: estimatedTokens <= maxTokens,
    estimatedTokens,
    maxTokens,
    percentUsed: (estimatedTokens / maxTokens) * 100,
  };
};
