import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import {
  registerValidation,
  loginValidation,
  validate,
} from '../middleware/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/register
router.post('/register', registerValidation, validate, register);

// @route   POST /api/auth/login
router.post('/login', loginValidation, validate, login);

// @route   GET /api/auth/profile
router.get('/profile', authenticate, getProfile);

export default router;
