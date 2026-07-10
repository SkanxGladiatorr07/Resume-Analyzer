import Resume from '../models/Resume.js';
import path from 'path';

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

    // Create resume record in database
    const resume = await Resume.create({
      user: req.user._id,
      fileName: filename,
      originalName: originalname,
      fileSize: size,
      fileType: fileType,
      filePath: filePath,
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        id: resume._id,
        fileName: resume.fileName,
        originalName: resume.originalName,
        uploadDate: resume.createdAt,
        fileSize: resume.fileSize,
        fileType: resume.fileType,
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
      .select('-filePath'); // Don't expose file path

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
