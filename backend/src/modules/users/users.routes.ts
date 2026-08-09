import { Router } from 'express';
import { body } from 'express-validator';
import { listUsers, createUser, updateUser, deleteUser } from './users.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validate';
import { Role } from '../../types/enums';

const router = Router();

// All user routes require ADMIN role
router.use(authenticate, requireRole([Role.ADMIN]));

// GET /users
router.get('/', listUsers);

// POST /users
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(Object.values(Role)).withMessage('Invalid role'),
  ],
  handleValidationErrors,
  createUser
);

// PUT /users/:id
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('role').optional().isIn(Object.values(Role)).withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  ],
  handleValidationErrors,
  updateUser
);

// DELETE /users/:id
router.delete('/:id', deleteUser);

export default router;
