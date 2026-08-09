import { Router } from 'express';
import { body } from 'express-validator';
import {
  listProducts, createProduct, getProduct, updateProduct, deleteProduct,
  getStockMovements, addStockIn, getProductStats,
} from './products.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validate';
import { Role } from '../../types/enums';

const router = Router();

router.use(authenticate);

const warehouseRoles = [Role.ADMIN, Role.WAREHOUSE];
const allStaffRoles = [Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS];

// GET /products/stats
router.get('/stats', requireRole(allStaffRoles), getProductStats);

// GET /products
router.get('/', requireRole(allStaffRoles), listProducts);

// POST /products
router.post(
  '/',
  requireRole(warehouseRoles),
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
    body('currentStock').optional().isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer'),
    body('minStockAlert').optional().isInt({ min: 0 }).withMessage('Min stock alert must be a non-negative integer'),
  ],
  handleValidationErrors,
  createProduct
);

// GET /products/:id
router.get('/:id', requireRole(allStaffRoles), getProduct);

// PUT /products/:id
router.put(
  '/:id',
  requireRole(warehouseRoles),
  [
    body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be positive'),
    body('minStockAlert').optional().isInt({ min: 0 }).withMessage('Min stock alert must be non-negative'),
  ],
  handleValidationErrors,
  updateProduct
);

// DELETE /products/:id
router.delete('/:id', requireRole([Role.ADMIN]), deleteProduct);

// GET /products/:id/stock-movements
router.get('/:id/stock-movements', requireRole(warehouseRoles), getStockMovements);

// POST /products/:id/stock-in
router.post(
  '/:id/stock-in',
  requireRole(warehouseRoles),
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('reason').optional().notEmpty().withMessage('Reason cannot be empty'),
  ],
  handleValidationErrors,
  addStockIn
);

export default router;
