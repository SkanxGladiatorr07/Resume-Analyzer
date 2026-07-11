/**
 * Resume Authorization Middleware
 * Ensures users can only access their own resumes
 */

import Resume from '../models/Resume.js';

/**
 * Check if resume belongs to authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const checkResumeOwnership = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user._id;

    // Find resume
    const resume = await Resume.findById(resumeId).select('user');

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    // Check ownership
    if (resume.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume',
      });
    }

    // Attach resume to request for use in controller
    req.resumeId = resumeId;
    next();
  } catch (error) {
    console.error('Resume ownership check error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error checking resume access',
    });
  }
};

/**
 * Validate resume ID parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateResumeId = (req, res, next) => {
  const resumeId = req.params.id;

  if (!resumeId) {
    return res.status(400).json({
      success: false,
      message: 'Resume ID is required',
    });
  }

  // Basic format validation (MongoDB ObjectId is 24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(resumeId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid resume ID format',
    });
  }

  next();
};
