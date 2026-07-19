import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import {
  registerValidation,
  loginValidation,
  validate,
} from '../middleware/validators.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user with rate limiting
// @access  Public
router.post('/register', authLimiter, registerValidation, validate, register);

// @route   POST /api/auth/login
// @desc    Login user with rate limiting
// @access  Public
router.post('/login', authLimiter, loginValidation, validate, login);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, getProfile);

export default router;
