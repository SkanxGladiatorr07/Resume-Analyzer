/**
 * JobDescription Controller
 * Handles HTTP requests for job description management
 */

import JobDescription from '../models/JobDescription.js';

/**
 * @desc    Create a new job description
 * @route   POST /api/job-descriptions
 * @access  Private
 */
export const createJobDescription = async (req, res) => {
  try {
    const { title, company, description, metadata } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    // Validate description length (minimum 100 characters)
    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 100) {
      return res.status(400).json({
        success: false,
        message: 'Job description must be at least 100 characters long',
      });
    }

    if (trimmedDescription.length > 20000) {
      return res.status(400).json({
        success: false,
        message: 'Job description cannot exceed 20,000 characters',
      });
    }

    // Validate title length
    if (title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Job title cannot be empty',
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Job title cannot exceed 200 characters',
      });
    }

    // Validate company length if provided
    if (company && company.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Company name cannot exceed 200 characters',
      });
    }

    // Create job description
    const jobDescription = new JobDescription({
      user: userId,
      title: title.trim(),
      company: company ? company.trim() : null,
      description: trimmedDescription,
      metadata: metadata || {},
    });

    await jobDescription.save();

    console.log(`✅ Job description created: ${jobDescription._id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Job description created successfully',
      data: jobDescription,
    });
  } catch (error) {
    console.error('Create job description error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create job description',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all job descriptions for the authenticated user
 * @route   GET /api/job-descriptions
 * @query   page, limit (for pagination)
 * @access  Private
 */
export const getJobDescriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
      });
    }

    // Get paginated job descriptions
    const jobDescriptions = await JobDescription.findByUserPaginated(userId, page, limit);
    const totalCount = await JobDescription.countByUser(userId);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      count: jobDescriptions.length,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: jobDescriptions,
    });
  } catch (error) {
    console.error('Get job descriptions error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job descriptions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get a single job description by ID
 * @route   GET /api/job-descriptions/:id
 * @access  Private
 */
export const getJobDescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find job description
    const jobDescription = await JobDescription.findById(id);

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message: 'Job description not found',
      });
    }

    // Check ownership
    if (jobDescription.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this job description',
      });
    }

    res.status(200).json({
      success: true,
      data: jobDescription,
    });
  } catch (error) {
    console.error('Get job description by ID error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job description ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job description',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update a job description
 * @route   PUT /api/job-descriptions/:id
 * @access  Private
 */
export const updateJobDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { title, company, description, metadata } = req.body;

    // Find job description
    const jobDescription = await JobDescription.findById(id);

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message: 'Job description not found',
      });
    }

    // Check ownership
    if (jobDescription.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job description',
      });
    }

    // Validate and update fields
    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Job title cannot be empty',
        });
      }
      if (trimmedTitle.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Job title cannot exceed 200 characters',
        });
      }
      jobDescription.title = trimmedTitle;
    }

    if (company !== undefined) {
      if (company && company.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Company name cannot exceed 200 characters',
        });
      }
      jobDescription.company = company ? company.trim() : null;
    }

    if (description !== undefined) {
      const trimmedDescription = description.trim();
      if (trimmedDescription.length < 100) {
        return res.status(400).json({
          success: false,
          message: 'Job description must be at least 100 characters long',
        });
      }
      if (trimmedDescription.length > 20000) {
        return res.status(400).json({
          success: false,
          message: 'Job description cannot exceed 20,000 characters',
        });
      }
      jobDescription.description = trimmedDescription;
    }

    if (metadata !== undefined) {
      jobDescription.metadata = metadata;
    }

    await jobDescription.save();

    console.log(`✅ Job description updated: ${jobDescription._id}`);

    res.status(200).json({
      success: true,
      message: 'Job description updated successfully',
      data: jobDescription,
    });
  } catch (error) {
    console.error('Update job description error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job description ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update job description',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete a job description
 * @route   DELETE /api/job-descriptions/:id
 * @access  Private
 */
export const deleteJobDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find job description
    const jobDescription = await JobDescription.findById(id);

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message: 'Job description not found',
      });
    }

    // Check ownership
    if (jobDescription.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job description',
      });
    }

    await JobDescription.deleteOne({ _id: id });

    console.log(`✅ Job description deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Job description deleted successfully',
    });
  } catch (error) {
    console.error('Delete job description error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job description ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete job description',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
