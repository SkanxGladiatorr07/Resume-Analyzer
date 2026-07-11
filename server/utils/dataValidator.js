/**
 * Data Validator
 * Validates and sanitizes parsed resume data before storage
 */

import {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  sanitizeText,
  limitArray,
  deduplicateArray,
  validateField,
} from './parserUtils.js';

/**
 * Validate and sanitize contact information
 * @param {Object} contactInfo - Contact information object
 * @returns {Object} Validated contact info
 */
export const validateContactInfo = (contactInfo) => {
  if (!contactInfo || typeof contactInfo !== 'object') {
    return {
      name: null,
      email: null,
      phone: null,
      linkedin: null,
      github: null,
    };
  }

  return {
    name: validateField(contactInfo.name, 'string', { maxLength: 100 })
      ? sanitizeText(contactInfo.name)
      : null,
    email: isValidEmail(contactInfo.email)
      ? contactInfo.email.toLowerCase().trim()
      : null,
    phone: isValidPhone(contactInfo.phone)
      ? sanitizeText(contactInfo.phone)
      : null,
    linkedin: isValidUrl(contactInfo.linkedin)
      ? sanitizeText(contactInfo.linkedin)
      : null,
    github: isValidUrl(contactInfo.github)
      ? sanitizeText(contactInfo.github)
      : null,
  };
};

/**
 * Validate and sanitize skills array
 * @param {Array<string>} skills - Skills array
 * @returns {Array<string>} Validated skills
 */
export const validateSkills = (skills) => {
  if (!Array.isArray(skills)) return [];

  const validated = skills
    .filter(skill => typeof skill === 'string' && skill.trim().length > 0)
    .map(skill => sanitizeText(skill))
    .filter(skill => skill.length >= 2 && skill.length <= 50);

  // Deduplicate and limit
  return limitArray(deduplicateArray(validated), 50);
};

/**
 * Validate education entry
 * @param {Object} edu - Education entry
 * @returns {Object} Validated education entry
 */
export const validateEducationEntry = (edu) => {
  if (!edu || typeof edu !== 'object') return null;

  const validated = {
    degree: validateField(edu.degree, 'string', { maxLength: 200 })
      ? sanitizeText(edu.degree)
      : null,
    institution: validateField(edu.institution, 'string', { maxLength: 200 })
      ? sanitizeText(edu.institution)
      : null,
    year: validateField(edu.year, 'string', { maxLength: 50 })
      ? sanitizeText(edu.year)
      : null,
    location: validateField(edu.location, 'string', { maxLength: 100 })
      ? sanitizeText(edu.location)
      : null,
  };

  // At least degree or institution must be present
  if (!validated.degree && !validated.institution) return null;

  return validated;
};

/**
 * Validate and sanitize education array
 * @param {Array<Object>} education - Education array
 * @returns {Array<Object>} Validated education
 */
export const validateEducation = (education) => {
  if (!Array.isArray(education)) return [];

  const validated = education
    .map(edu => validateEducationEntry(edu))
    .filter(edu => edu !== null);

  return limitArray(validated, 10);
};

/**
 * Validate experience entry
 * @param {Object} exp - Experience entry
 * @returns {Object} Validated experience entry
 */
export const validateExperienceEntry = (exp) => {
  if (!exp || typeof exp !== 'object') return null;

  const validated = {
    title: validateField(exp.title, 'string', { maxLength: 200 })
      ? sanitizeText(exp.title)
      : null,
    company: validateField(exp.company, 'string', { maxLength: 200 })
      ? sanitizeText(exp.company)
      : null,
    duration: validateField(exp.duration, 'string', { maxLength: 100 })
      ? sanitizeText(exp.duration)
      : null,
    location: validateField(exp.location, 'string', { maxLength: 100 })
      ? sanitizeText(exp.location)
      : null,
    description: Array.isArray(exp.description)
      ? limitArray(
          exp.description
            .filter(desc => typeof desc === 'string' && desc.trim().length > 0)
            .map(desc => sanitizeText(desc))
            .filter(desc => desc.length >= 10 && desc.length <= 500),
          20
        )
      : [],
  };

  // At least title or company must be present
  if (!validated.title && !validated.company) return null;

  return validated;
};

/**
 * Validate and sanitize experience array
 * @param {Array<Object>} experience - Experience array
 * @returns {Array<Object>} Validated experience
 */
export const validateExperience = (experience) => {
  if (!Array.isArray(experience)) return [];

  const validated = experience
    .map(exp => validateExperienceEntry(exp))
    .filter(exp => exp !== null);

  return limitArray(validated, 15);
};

/**
 * Validate project entry
 * @param {Object} project - Project entry
 * @returns {Object} Validated project entry
 */
export const validateProjectEntry = (project) => {
  if (!project || typeof project !== 'object') return null;

  const validated = {
    name: validateField(project.name, 'string', { maxLength: 200 })
      ? sanitizeText(project.name)
      : null,
    technologies: Array.isArray(project.technologies)
      ? limitArray(
          project.technologies
            .filter(tech => typeof tech === 'string' && tech.trim().length > 0)
            .map(tech => sanitizeText(tech))
            .filter(tech => tech.length >= 2 && tech.length <= 50),
          20
        )
      : [],
    description: Array.isArray(project.description)
      ? limitArray(
          project.description
            .filter(desc => typeof desc === 'string' && desc.trim().length > 0)
            .map(desc => sanitizeText(desc))
            .filter(desc => desc.length >= 10 && desc.length <= 500),
          20
        )
      : [],
  };

  // Must have a name
  if (!validated.name) return null;

  return validated;
};

/**
 * Validate and sanitize projects array
 * @param {Array<Object>} projects - Projects array
 * @returns {Array<Object>} Validated projects
 */
export const validateProjects = (projects) => {
  if (!Array.isArray(projects)) return [];

  const validated = projects
    .map(project => validateProjectEntry(project))
    .filter(project => project !== null);

  return limitArray(validated, 10);
};

/**
 * Validate certification entry
 * @param {Object} cert - Certification entry
 * @returns {Object} Validated certification entry
 */
export const validateCertificationEntry = (cert) => {
  if (!cert || typeof cert !== 'object') return null;

  const validated = {
    name: validateField(cert.name, 'string', { maxLength: 200 })
      ? sanitizeText(cert.name)
      : null,
    issuer: validateField(cert.issuer, 'string', { maxLength: 200 })
      ? sanitizeText(cert.issuer)
      : null,
    date: validateField(cert.date, 'string', { maxLength: 50 })
      ? sanitizeText(cert.date)
      : null,
  };

  // Must have a name
  if (!validated.name) return null;

  return validated;
};

/**
 * Validate and sanitize certifications array
 * @param {Array<Object>} certifications - Certifications array
 * @returns {Array<Object>} Validated certifications
 */
export const validateCertifications = (certifications) => {
  if (!Array.isArray(certifications)) return [];

  const validated = certifications
    .map(cert => validateCertificationEntry(cert))
    .filter(cert => cert !== null);

  return limitArray(validated, 20);
};

/**
 * Validate language entry
 * @param {Object} lang - Language entry
 * @returns {Object} Validated language entry
 */
export const validateLanguageEntry = (lang) => {
  if (!lang || typeof lang !== 'object') return null;

  const validated = {
    language: validateField(lang.language, 'string', { maxLength: 50 })
      ? sanitizeText(lang.language)
      : null,
    proficiency: validateField(lang.proficiency, 'string', { maxLength: 50 })
      ? sanitizeText(lang.proficiency)
      : null,
  };

  // Must have a language
  if (!validated.language) return null;

  return validated;
};

/**
 * Validate and sanitize languages array
 * @param {Array<Object>} languages - Languages array
 * @returns {Array<Object>} Validated languages
 */
export const validateLanguages = (languages) => {
  if (!Array.isArray(languages)) return [];

  const validated = languages
    .map(lang => validateLanguageEntry(lang))
    .filter(lang => lang !== null);

  return limitArray(validated, 10);
};

/**
 * Validate entire structured data object
 * @param {Object} structuredData - Complete structured data
 * @returns {Object} Validated structured data
 */
export const validateStructuredData = (structuredData) => {
  if (!structuredData || typeof structuredData !== 'object') {
    return {
      contactInfo: validateContactInfo(null),
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      languages: [],
    };
  }

  return {
    contactInfo: validateContactInfo(structuredData.contactInfo),
    skills: validateSkills(structuredData.skills),
    education: validateEducation(structuredData.education),
    experience: validateExperience(structuredData.experience),
    projects: validateProjects(structuredData.projects),
    certifications: validateCertifications(structuredData.certifications),
    languages: validateLanguages(structuredData.languages),
  };
};
