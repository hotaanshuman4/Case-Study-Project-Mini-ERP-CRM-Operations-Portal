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
import { ChallanStatus, MovementType } from '../../types/enums';
import { generateChallanNumber } from '../../utils/helpers';

/**
 * GET /challans
 */
export const listChallans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const search = req.query.search as string | undefined;
    const status = req.query.status as ChallanStatus | undefined;

    const where: Prisma.ChallanWhereInput = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status;

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, businessName: true, mobile: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { challanItems: true } },
        },
      }),
      prisma.challan.count({ where }),
    ]);

    sendPaginated(res, challans, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /challans — Create draft or confirmed challan
 */
export const createChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId, items, notes, status: requestedStatus } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      sendBadRequest(res, 'At least one product item is required');
      return;
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      sendNotFound(res, 'Customer');
      return;
    }

    // Validate and fetch products
    const productIds: string[] = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      sendBadRequest(res, 'One or more products not found or inactive');
      return;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate quantities
    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        sendBadRequest(res, `Invalid quantity for product ${item.productId}`);
        return;
      }
    }

    const challanStatus = requestedStatus === ChallanStatus.CONFIRMED
      ? ChallanStatus.CONFIRMED
      : ChallanStatus.DRAFT;

    // If confirming, check stock availability BEFORE transaction
    if (challanStatus === ChallanStatus.CONFIRMED) {
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        if (product.currentStock < item.quantity) {
          sendBadRequest(
            res,
            `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`
          );
          return;
        }
      }
    }

    // Calculate totals
    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      totalQuantity += item.quantity;
      totalAmount += item.quantity * Number(product.unitPrice);
    }

    // Build challan number
    const challanNumber = await generateChallanNumber();

    // Create challan within a transaction
    const challan = await prisma.$transaction(async (tx) => {
      // Create the challan
      const newChallan = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          customerSnapshot: JSON.stringify({
            id: customer.id,
            name: customer.name,
            businessName: customer.businessName,
            mobile: customer.mobile,
            email: customer.email,
            address: customer.address,
            gstNumber: customer.gstNumber,
          }),
          status: challanStatus,
          totalQuantity,
          totalAmount,
          notes,
          createdBy: req.user!.userId,
          challanItems: {
            create: items.map((item: { productId: string; quantity: number }) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                productSnapshot: JSON.stringify({
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  category: product.category,
                  unitPrice: Number(product.unitPrice),
                }),
                quantity: item.quantity,
                unitPrice: product.unitPrice,
                totalPrice: Number(product.unitPrice) * item.quantity,
              };
            }),
          },
        },
        include: {
          challanItems: true,
          customer: { select: { id: true, name: true, businessName: true } },
          creator: { select: { id: true, name: true } },
        },
      });

      // If confirmed, deduct stock and log movements
      if (challanStatus === ChallanStatus.CONFIRMED) {
        for (const item of items) {
          const product = productMap.get(item.productId)!;

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: MovementType.OUT,
              reason: `Sales Challan: ${challanNumber}`,
              createdBy: req.user!.userId,
            },
          });
        }
      }

      return newChallan;
    });

    sendCreated(res, challan, `Challan ${challanNumber} created successfully`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /challans/:id
 */
export const getChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: req.params.id },
      include: {
        challanItems: {
          include: { product: { select: { id: true, name: true, sku: true, currentStock: true } } },
        },
        customer: true,
        creator: { select: { id: true, name: true } },
      },
    });

    if (!challan) {
      sendNotFound(res, 'Challan');
      return;
    }

    const parsed = {
      ...challan,
      customerSnapshot: typeof challan.customerSnapshot === 'string'
        ? JSON.parse(challan.customerSnapshot)
        : challan.customerSnapshot,
      challanItems: challan.challanItems.map((item) => ({
        ...item,
        productSnapshot: typeof item.productSnapshot === 'string'
          ? JSON.parse(item.productSnapshot)
          : item.productSnapshot,
      })),
    };

    sendSuccess(res, parsed);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /challans/:id/confirm
 */
export const confirmChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { challanItems: { include: { product: true } } },
    });

    if (!challan) {
      sendNotFound(res, 'Challan');
      return;
    }

    if (challan.status !== ChallanStatus.DRAFT) {
      sendBadRequest(res, `Cannot confirm a challan with status: ${challan.status}`);
      return;
    }

    // Check stock availability
    for (const item of challan.challanItems) {
      if (item.product.currentStock < item.quantity) {
        sendBadRequest(
          res,
          `Insufficient stock for "${item.product.name}". Available: ${item.product.currentStock}, Required: ${item.quantity}`
        );
        return;
      }
    }

    // Confirm in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const confirmed = await tx.challan.update({
        where: { id },
        data: { status: ChallanStatus.CONFIRMED },
      });

      for (const item of challan.challanItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: MovementType.OUT,
            reason: `Sales Challan Confirmed: ${challan.challanNumber}`,
            createdBy: req.user!.userId,
          },
        });
      }

      return confirmed;
    });

    sendSuccess(res, updated, 'Challan confirmed successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /challans/:id/cancel
 */
export const cancelChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { challanItems: true },
    });

    if (!challan) {
      sendNotFound(res, 'Challan');
      return;
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      sendBadRequest(res, 'Challan is already cancelled');
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.challan.update({
        where: { id },
        data: { status: ChallanStatus.CANCELLED },
      });

      // If it was confirmed, reverse stock deductions
      if (challan.status === ChallanStatus.CONFIRMED) {
        for (const item of challan.challanItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: MovementType.IN,
              reason: `Challan Cancelled: ${challan.challanNumber}`,
              createdBy: req.user!.userId,
            },
          });
        }
      }

      return cancelled;
    });

    sendSuccess(res, updated, 'Challan cancelled successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /challans/stats
 */
export const getChallanStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [total, byStatus, totalRevenue] = await Promise.all([
      prisma.challan.count(),
      prisma.challan.groupBy({ by: ['status'], _count: true }),
      prisma.challan.aggregate({
        where: { status: ChallanStatus.CONFIRMED },
        _sum: { totalAmount: true },
      }),
    ]);

    sendSuccess(res, {
      total,
      byStatus,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    });
  } catch (err) {
    next(err);
  }
};
