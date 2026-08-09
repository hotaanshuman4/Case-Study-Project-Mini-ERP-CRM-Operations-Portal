import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
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
import { Role } from '../../types/enums';

/**
 * GET /users — Admin only
 */
export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const search = req.query.search as string | undefined;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    sendPaginated(res, users, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /users — Admin only
 */
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      sendBadRequest(res, 'Email already in use');
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: role as Role,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    sendCreated(res, user, 'User created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /users/:id — Admin only
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role: role as Role }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, updatedAt: true },
    });

    sendSuccess(res, updated, 'User updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /users/:id — Admin only
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user!.userId) {
      sendBadRequest(res, 'You cannot delete your own account');
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    await prisma.user.update({ where: { id }, data: { isActive: false } });
    sendSuccess(res, null, 'User deactivated successfully');
  } catch (err) {
    next(err);
  }
};
