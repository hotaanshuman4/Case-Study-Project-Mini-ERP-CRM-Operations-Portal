import { Router } from 'express';
import { body } from 'express-validator';
import {
  listCustomers, createCustomer, getCustomer, updateCustomer,
  getFollowUps, addFollowUp, getCustomerStats,
} from './customers.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validate';
import { Role, CustomerType, CustomerStatus } from '../../types/enums';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ADMIN and SALES can manage customers
const salesRoles = [Role.ADMIN, Role.SALES];

// GET /customers/stats
router.get('/stats', requireRole(salesRoles), getCustomerStats);

// GET /customers
router.get('/', requireRole(salesRoles), listCustomers);

// POST /customers
router.post(
  '/',
  requireRole(salesRoles),
  [
    body('name').notEmpty().withMessage('Customer name is required'),
    body('mobile').notEmpty().withMessage('Mobile number is required'),
    body('businessName').notEmpty().withMessage('Business name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('customerType').optional().isIn(Object.values(CustomerType)).withMessage('Invalid customer type'),
    body('status').optional().isIn(Object.values(CustomerStatus)).withMessage('Invalid status'),
    body('gstNumber').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GST number format'),
  ],
  handleValidationErrors,
  createCustomer
);

// GET /customers/:id
router.get('/:id', requireRole(salesRoles), getCustomer);

// PUT /customers/:id
router.put(
  '/:id',
  requireRole(salesRoles),
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('customerType').optional().isIn(Object.values(CustomerType)).withMessage('Invalid customer type'),
    body('status').optional().isIn(Object.values(CustomerStatus)).withMessage('Invalid status'),
    body('gstNumber').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GST number format'),
  ],
  handleValidationErrors,
  updateCustomer
);

// GET /customers/:id/followups
router.get('/:id/followups', requireRole(salesRoles), getFollowUps);

// POST /customers/:id/followups
router.post(
  '/:id/followups',
  requireRole(salesRoles),
  [body('note').notEmpty().withMessage('Follow-up note is required')],
  handleValidationErrors,
  addFollowUp
);

export default router;
