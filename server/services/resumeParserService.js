/**
 * Resume Parser Service
 * Handles text extraction from PDF and DOCX files
 */

import fs from 'fs';
import mammoth from 'mammoth';
import { createRequire } from 'module';

// Import pdf-parse using createRequire for CommonJS compatibility
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Parse resume based on file type
 * @param {string} filePath - Path to the resume file
 * @param {string} fileType - File type ('pdf' or 'docx')
 * @returns {Promise<string>} Extracted text
 */
export const parseResume = async (filePath, fileType) => {
  try {
    let extractedText = '';

    if (fileType === 'pdf') {
      extractedText = await parsePDF(filePath);
    } else if (fileType === 'docx') {
      extractedText = await parseDOCX(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Clean and normalize the extracted text
    const cleanedText = cleanText(extractedText);

    return cleanedText;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
};

/**
 * Parse PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} Extracted text
 */
const parsePDF = async (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF file not found');
    }

    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);

    // Parse PDF
    const data = await pdfParse(dataBuffer);

    // Return extracted text
    return data.text || '';
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};

/**
 * Parse DOCX file
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<string>} Extracted text
 */
const parseDOCX = async (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('DOCX file not found');
    }

    // Parse DOCX
    const result = await mammoth.extractRawText({ path: filePath });

    // Return extracted text
    return result.value || '';
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
};

/**
 * Clean and normalize extracted text
 * - Remove excessive whitespace
 * - Preserve paragraph breaks
 * - Remove special characters that don't add value
 * @param {string} text - Raw extracted text
 * @returns {string} Cleaned text
 */
const cleanText = (text) => {
  if (!text) return '';

  let cleaned = text;

  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/ {2,}/g, ' ');

  // Replace multiple newlines with double newline (preserve paragraphs)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove spaces at the beginning and end of lines
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // Remove multiple consecutive spaces after newlines
  cleaned = cleaned.replace(/\n +/g, '\n');

  // Trim the entire text
  cleaned = cleaned.trim();

  return cleaned;
};

/**
 * Validate if a file can be parsed
 * @param {string} filePath - Path to file
 * @param {string} fileType - File type
 * @returns {Promise<boolean>} Whether file is parseable
 */
export const validateParseableFile = async (filePath, fileType) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return false;
    }

    // Check file size (corrupted files might be 0 bytes or unusually small)
    const stats = fs.statSync(filePath);
    if (stats.size < 100) {
      // Files smaller than 100 bytes are likely corrupted
      return false;
    }

    // Try to read first few bytes to ensure file is readable
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(100);
    fs.readSync(fd, buffer, 0, 100, 0);
    fs.closeSync(fd);

    return true;
  } catch (error) {
    console.error('File validation error:', error);
    return false;
  }
};

/**
 * Get text preview (first 500 characters)
 * @param {string} text - Full text
 * @param {number} length - Preview length (default: 500)
 * @returns {string} Text preview
 */
export const getTextPreview = (text, length = 500) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Get word count from text
 * @param {string} text - Text content
 * @returns {number} Word count
 */
export const getWordCount = (text) => {
  if (!text) return 0;
  return text.split(/\s+/).filter((word) => word.length > 0).length;
};

/**
 * Check if parsing was successful
 * @param {string} text - Extracted text
 * @returns {boolean} Whether parsing was successful
 */
export const isParsingSuccessful = (text) => {
  // Consider parsing successful if we extracted at least 50 characters
  // and at least 5 words
  if (!text) return false;

  const wordCount = getWordCount(text);
  return text.length >= 50 && wordCount >= 5;
};
