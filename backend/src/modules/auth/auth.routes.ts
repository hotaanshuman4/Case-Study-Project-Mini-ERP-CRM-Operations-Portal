import { Router } from 'express';
import { body } from 'express-validator';
import { login, getMe, changePassword } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validate';

const router = Router();

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  login
);

// GET /auth/me
router.get('/me', authenticate, getMe);

// POST /auth/change-password
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  handleValidationErrors,
  changePassword
);

export default router;
