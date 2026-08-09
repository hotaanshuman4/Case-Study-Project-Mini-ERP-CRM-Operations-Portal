import { Router } from 'express';
import { body } from 'express-validator';
import {
  listChallans, createChallan, getChallan,
  confirmChallan, cancelChallan, getChallanStats,
} from './challans.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validate';
import { Role, ChallanStatus } from '../../types/enums';

const router = Router();

router.use(authenticate);

const salesRoles = [Role.ADMIN, Role.SALES];
const allStaffRoles = [Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS];

// GET /challans/stats
router.get('/stats', requireRole(allStaffRoles), getChallanStats);

// GET /challans
router.get('/', requireRole(allStaffRoles), listChallans);

// POST /challans
router.post(
  '/',
  requireRole(salesRoles),
  [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required for each item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1 for each item'),
    body('status')
      .optional()
      .isIn([ChallanStatus.DRAFT, ChallanStatus.CONFIRMED])
      .withMessage('Status must be DRAFT or CONFIRMED'),
  ],
  handleValidationErrors,
  createChallan
);

// GET /challans/:id
router.get('/:id', requireRole(allStaffRoles), getChallan);

// PUT /challans/:id/confirm
router.put('/:id/confirm', requireRole(salesRoles), confirmChallan);

// PUT /challans/:id/cancel
router.put('/:id/cancel', requireRole(salesRoles), cancelChallan);

export default router;
