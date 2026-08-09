import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { generateToken } from '../../middleware/auth';
import { sendSuccess, sendBadRequest, sendUnauthorized } from '../../utils/response';

/**
 * POST /auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/me
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/change-password
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      sendBadRequest(res, 'Current password is incorrect');
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};
