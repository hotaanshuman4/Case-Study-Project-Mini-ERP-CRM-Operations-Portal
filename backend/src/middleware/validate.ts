import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendBadRequest } from '../utils/response';

/**
 * Middleware: run after express-validator chains to return 400 on failures
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendBadRequest(res, 'Validation failed', errors.array());
    return;
  }
  next();
};
