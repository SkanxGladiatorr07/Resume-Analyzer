import Resume from '../models/Resume.js';
import path from 'path';
import * as parsingPipeline from '../services/parsingPipeline.js';

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

    console.log(`📤 Resume uploaded: ${originalname} (ID: ${resume._id})`);

    // Start parsing immediately (non-blocking)
    // Don't await - let it run in background
    parsingPipeline.startParsing(resume._id.toString())
      .catch(err => {
        console.error('Background parsing error:', err);
      });

    // Return success response immediately
    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully. Parsing started.',
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
    // Resume ownership already verified by middleware
    const resume = await Resume.findById(req.params.id);

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
    // Resume ownership already verified by middleware
    const resume = await Resume.findById(req.params.id);

    // Check parsing status
    if (resume.parsingStatus === 'pending' || resume.parsingStatus === 'processing') {
      return res.status(202).json({
        success: false,
        message: resume.parsingStatus === 'processing'
          ? 'Text extraction is in progress. Please wait a moment.'
          : 'Text extraction has not started yet. Please try again in a moment.',
        parsingStatus: resume.parsingStatus,
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

/**
 * @desc    Get resume parsed structured data
 * @route   GET /api/resumes/:id/parsed
 * @access  Private
 */
export const getResumeParsedData = async (req, res) => {
  try {
    // Resume ownership already verified by middleware
    const resume = await Resume.findById(req.params.id);

    // Check parsing status
    if (resume.parsingStatus === 'pending' || resume.parsingStatus === 'processing') {
      return res.status(202).json({
        success: false,
        message: resume.parsingStatus === 'processing' 
          ? 'Resume is currently being parsed. Please wait a moment.'
          : 'Resume parsing has not started yet. Please try again in a moment.',
        parsingStatus: resume.parsingStatus,
      });
    }

    if (resume.parsingStatus === 'failed') {
      return res.status(422).json({
        success: false,
        message: `Resume parsing failed: ${resume.parsingError || 'Unknown error'}`,
        parsingStatus: 'failed',
        error: resume.parsingError,
      });
    }

    // Return structured data
    res.status(200).json({
      success: true,
      data: {
        resumeId: resume._id,
        originalName: resume.originalName,
        wordCount: resume.wordCount,
        parsingStatus: resume.parsingStatus,
        structuredData: resume.structuredData || {
          contactInfo: {},
          skills: [],
          education: [],
          experience: [],
          projects: [],
          certifications: [],
          languages: [],
        },
      },
    });
  } catch (error) {
    console.error('Get parsed data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching parsed data',
    });
  }
};

/**
 * @desc    Get resume parsing status
 * @route   GET /api/resumes/:id/status
 * @access  Private
 */
export const getParsingStatus = async (req, res) => {
  try {
    // Resume ownership already verified by middleware
    const resume = await Resume.findById(req.params.id).select(
      'originalName parsingStatus parsingError parsingStartedAt parsingCompletedAt wordCount'
    );

    // Calculate duration if available
    let duration = null;
    if (resume.parsingStartedAt && resume.parsingCompletedAt) {
      duration = resume.parsingCompletedAt - resume.parsingStartedAt;
    }

    res.status(200).json({
      success: true,
      data: {
        resumeId: resume._id,
        originalName: resume.originalName,
        parsingStatus: resume.parsingStatus,
        parsingError: resume.parsingError,
        startedAt: resume.parsingStartedAt,
        completedAt: resume.parsingCompletedAt,
        duration,
        wordCount: resume.wordCount,
      },
    });
  } catch (error) {
    console.error('Get parsing status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching parsing status',
    });
  }
};


/**
 * @desc    Toggle resume pin status
 * @route   PATCH /api/resumes/:id/pin
 * @access  Private
 */
export const togglePin = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    // Verify ownership
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Toggle pin status
    resume.isPinned = !resume.isPinned;
    resume.pinnedAt = resume.isPinned ? new Date() : null;
    await resume.save();

    res.status(200).json({
      success: true,
      message: resume.isPinned ? 'Resume pinned successfully' : 'Resume unpinned successfully',
      data: {
        resumeId: resume._id,
        isPinned: resume.isPinned,
        pinnedAt: resume.pinnedAt,
      },
    });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling pin status',
    });
  }
};

/**
 * @desc    Set resume as default
 * @route   PATCH /api/resumes/:id/default
 * @access  Private
 */
export const setDefault = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    // Verify ownership
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Remove default from all other resumes for this user
    await Resume.updateMany(
      { user: req.user._id, _id: { $ne: req.params.id } },
      { isDefault: false }
    );

    // Set this resume as default
    resume.isDefault = true;
    await resume.save();

    res.status(200).json({
      success: true,
      message: 'Default resume set successfully',
      data: {
        resumeId: resume._id,
        isDefault: resume.isDefault,
      },
    });
  } catch (error) {
    console.error('Set default error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error setting default resume',
    });
  }
};

/**
 * @desc    Remove default resume
 * @route   DELETE /api/resumes/:id/default
 * @access  Private
 */
export const removeDefault = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    // Verify ownership
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Remove default status
    resume.isDefault = false;
    await resume.save();

    res.status(200).json({
      success: true,
      message: 'Default resume removed successfully',
      data: {
        resumeId: resume._id,
        isDefault: resume.isDefault,
      },
    });
  } catch (error) {
    console.error('Remove default error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing default resume',
    });
  }
};
