import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNotFound,
  getPaginationParams,
  buildPaginationMeta,
} from '../../utils/response';
import { CustomerStatus, CustomerType } from '../../types/enums';

/**
 * GET /customers
 */
export const listCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const search = req.query.search as string | undefined;
    const status = req.query.status as CustomerStatus | undefined;
    const customerType = req.query.type as CustomerType | undefined;

    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (customerType) where.customerType = customerType;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          mobile: true,
          email: true,
          businessName: true,
          customerType: true,
          status: true,
          followUpDate: true,
          createdAt: true,
        },
      }),
      prisma.customer.count({ where }),
    ]);

    sendPaginated(res, customers, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /customers
 */
export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name, mobile, email, businessName, gstNumber,
      customerType, address, status, followUpDate, notes,
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber,
        customerType: customerType || CustomerType.RETAIL,
        address,
        status: status || CustomerStatus.LEAD,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes,
        createdBy: req.user!.userId,
      },
    });

    sendCreated(res, customer, 'Customer created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /customers/:id
 */
export const getCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true } },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: { creator: { select: { id: true, name: true } } },
        },
        _count: { select: { challans: true } },
      },
    });

    if (!customer) {
      sendNotFound(res, 'Customer');
      return;
    }

    sendSuccess(res, customer);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /customers/:id
 */
export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      sendNotFound(res, 'Customer');
      return;
    }

    const {
      name, mobile, email, businessName, gstNumber,
      customerType, address, status, followUpDate, notes,
    } = req.body;

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(mobile && { mobile }),
        ...(email !== undefined && { email }),
        ...(businessName && { businessName }),
        ...(gstNumber !== undefined && { gstNumber }),
        ...(customerType && { customerType }),
        ...(address && { address }),
        ...(status && { status }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
        ...(notes !== undefined && { notes }),
      },
    });

    sendSuccess(res, updated, 'Customer updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /customers/:id/followups
 */
export const getFollowUps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      sendNotFound(res, 'Customer');
      return;
    }

    const [followUps, total] = await Promise.all([
      prisma.customerFollowUp.findMany({
        where: { customerId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: { id: true, name: true } } },
      }),
      prisma.customerFollowUp.count({ where: { customerId: id } }),
    ]);

    sendPaginated(res, followUps, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /customers/:id/followups
 */
export const addFollowUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      sendNotFound(res, 'Customer');
      return;
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId: id,
        note,
        createdBy: req.user!.userId,
      },
      include: { creator: { select: { id: true, name: true } } },
    });

    sendCreated(res, followUp, 'Follow-up added successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /customers/stats
 */
export const getCustomerStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [total, byStatus, byType] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.groupBy({ by: ['status'], _count: true }),
      prisma.customer.groupBy({ by: ['customerType'], _count: true }),
    ]);

    sendSuccess(res, { total, byStatus, byType });
  } catch (err) {
    next(err);
  }
};
