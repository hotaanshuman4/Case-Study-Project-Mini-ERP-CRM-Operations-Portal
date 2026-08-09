import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNotFound,
  sendBadRequest,
  getPaginationParams,
  buildPaginationMeta,
} from '../../utils/response';
import { MovementType } from '../../types/enums';
import { generateSku } from '../../utils/helpers';

/**
 * GET /products
 */
export const listProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const lowStock = req.query.lowStock === 'true';

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = { contains: category, mode: 'insensitive' };

    // Low stock filter is done post-fetch (Prisma can't compare two fields natively without raw)
    // We use a large upper bound and filter in-memory for simplicity

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        // If lowStock filter, fetch more and filter in-memory
        skip: lowStock ? 0 : skip,
        take: lowStock ? 1000 : limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Add lowStock flag to each product, and filter if requested
    let enriched = products.map((p) => ({
      ...p,
      isLowStock: p.currentStock <= p.minStockAlert,
    }));

    if (lowStock) {
      enriched = enriched.filter((p) => p.isLowStock);
    }

    // Paginate filtered results
    const paginatedData = lowStock ? enriched.slice(skip, skip + limit) : enriched;
    const finalTotal = lowStock ? enriched.length : total;

    sendPaginated(res, paginatedData, buildPaginationMeta(finalTotal, page, limit));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /products
 */
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name, sku, category, unitPrice, currentStock,
      minStockAlert, location, imageUrl,
    } = req.body;

    const finalSku = sku || generateSku(name);

    const existing = await prisma.product.findUnique({ where: { sku: finalSku } });
    if (existing) {
      sendBadRequest(res, 'A product with this SKU already exists');
      return;
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          sku: finalSku,
          category,
          unitPrice,
          currentStock: currentStock || 0,
          minStockAlert: minStockAlert || 10,
          location,
          imageUrl,
        },
      });

      // Log initial stock if provided
      if (currentStock && currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: p.id,
            quantityChanged: currentStock,
            movementType: MovementType.IN,
            reason: 'Initial stock',
            createdBy: req.user!.userId,
          },
        });
      }

      return p;
    });

    sendCreated(res, product, 'Product created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /products/:id
 */
export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { stockMovements: true, challanItems: true } },
      },
    });

    if (!product || !product.isActive) {
      sendNotFound(res, 'Product');
      return;
    }

    sendSuccess(res, {
      ...product,
      isLowStock: product.currentStock <= product.minStockAlert,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /products/:id
 */
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || !product.isActive) {
      sendNotFound(res, 'Product');
      return;
    }

    const {
      name, category, unitPrice, minStockAlert, location, imageUrl,
    } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(unitPrice !== undefined && { unitPrice }),
        ...(minStockAlert !== undefined && { minStockAlert }),
        ...(location !== undefined && { location }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    sendSuccess(res, updated, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /products/:id — soft delete
 */
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      sendNotFound(res, 'Product');
      return;
    }

    await prisma.product.update({ where: { id }, data: { isActive: false } });
    sendSuccess(res, null, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /products/:id/stock-movements
 */
export const getStockMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      sendNotFound(res, 'Product');
      return;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { productId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: { id: true, name: true } } },
      }),
      prisma.stockMovement.count({ where: { productId: id } }),
    ]);

    sendPaginated(res, movements, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /products/:id/stock-in — Manual stock addition
 */
export const addStockIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || !product.isActive) {
      sendNotFound(res, 'Product');
      return;
    }

    if (quantity <= 0) {
      sendBadRequest(res, 'Quantity must be greater than 0');
      return;
    }

    const [movement, updated] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId: id,
          quantityChanged: quantity,
          movementType: MovementType.IN,
          reason: reason || 'Manual stock addition',
          createdBy: req.user!.userId,
        },
      }),
      prisma.product.update({
        where: { id },
        data: { currentStock: { increment: quantity } },
      }),
    ]);

    sendSuccess(res, { movement, newStock: updated.currentStock }, 'Stock added successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /products/stats
 */
export const getProductStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [total, lowStockItems, byCategory] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: {
          isActive: true,
          currentStock: { lte: 10 },
        },
      }),
      prisma.product.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: true,
        _sum: { currentStock: true },
      }),
    ]);

    sendSuccess(res, { total, lowStockItems, byCategory });
  } catch (err) {
    next(err);
  }
};
