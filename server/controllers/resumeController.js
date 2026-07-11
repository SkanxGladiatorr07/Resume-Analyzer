import Resume from '../models/Resume.js';
import path from 'path';
import * as resumeParserService from '../services/resumeParserService.js';

/**
 * @desc    Upload resume
 * @route   POST /api/resumes/upload
 * @access  Private
 */
export const uploadResume = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Extract file information
    const { filename, originalname, size, mimetype, path: filePath } = req.file;

    // Determine file type
    const ext = path.extname(originalname).toLowerCase();
    const fileType = ext === '.pdf' ? 'pdf' : 'docx';

    // Create resume record in database with pending parsing status
    const resume = await Resume.create({
      user: req.user._id,
      fileName: filename,
      originalName: originalname,
      fileSize: size,
      fileType: fileType,
      filePath: filePath,
      parsingStatus: 'pending',
    });

    // Parse resume asynchronously (don't wait for it to complete)
    parseResumeAsync(resume);

    // Return success response immediately
    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully. Text extraction in progress.',
      data: {
        id: resume._id,
        fileName: resume.fileName,
        originalName: resume.originalName,
        uploadDate: resume.createdAt,
        fileSize: resume.fileSize,
        fileType: resume.fileType,
        parsingStatus: resume.parsingStatus,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
    });
  }
};

/**
 * Parse resume asynchronously
 * @param {Object} resume - Resume document
 */
const parseResumeAsync = async (resume) => {
  try {
    // Validate file is parseable
    const isValid = await resumeParserService.validateParseableFile(
      resume.filePath,
      resume.fileType
    );

    if (!isValid) {
      throw new Error('File is corrupted or unreadable');
    }

    // Extract text from the resume
    const extractedText = await resumeParserService.parseResume(
      resume.filePath,
      resume.fileType
    );

    // Check if parsing was successful
    const isSuccess = resumeParserService.isParsingSuccessful(extractedText);

    if (!isSuccess) {
      throw new Error('Extracted text is too short or empty');
    }

    // Get word count
    const wordCount = resumeParserService.getWordCount(extractedText);

    // Update resume with extracted text
    resume.extractedText = extractedText;
    resume.wordCount = wordCount;
    resume.parsingStatus = 'success';
    resume.parsingError = null;
    await resume.save();

    console.log(`✅ Successfully parsed resume: ${resume.originalName} (${wordCount} words)`);
  } catch (error) {
    console.error(`❌ Error parsing resume ${resume.originalName}:`, error.message);

    // Update resume with error status
    resume.parsingStatus = 'failed';
    resume.parsingError = error.message;
    await resume.save();
  }
};

/**
 * @desc    Get all resumes for authenticated user
 * @route   GET /api/resumes
 * @access  Private
 */
export const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-filePath -extractedText'); // Don't expose file path and full text

    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes,
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching resumes',
    });
  }
};

/**
 * @desc    Delete resume
 * @route   DELETE /api/resumes/:id
 * @access  Private
 */
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    // Check if resume belongs to user
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resume',
      });
    }

    await resume.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting resume',
    });
  }
};

/**
 * @desc    Get resume raw text
 * @route   GET /api/resumes/:id/raw-text
 * @access  Private
 */
export const getResumeRawText = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    // Check if resume belongs to user
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume',
      });
    }

    // Check parsing status
    if (resume.parsingStatus === 'pending') {
      return res.status(202).json({
        success: false,
        message: 'Text extraction is still in progress. Please try again in a moment.',
        parsingStatus: 'pending',
      });
    }

    if (resume.parsingStatus === 'failed') {
      return res.status(422).json({
        success: false,
        message: `Text extraction failed: ${resume.parsingError || 'Unknown error'}`,
        parsingStatus: 'failed',
        error: resume.parsingError,
      });
    }

    // Return extracted text
    res.status(200).json({
      success: true,
      data: {
        resumeId: resume._id,
        originalName: resume.originalName,
        extractedText: resume.extractedText,
        wordCount: resume.wordCount,
        parsingStatus: resume.parsingStatus,
      },
    });
  } catch (error) {
    console.error('Get raw text error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching resume text',
    });
  }
};
