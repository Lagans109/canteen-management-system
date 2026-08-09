import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { verifyToken, type JwtPayload } from '../modules/auth/jwt';
import type { Role } from '../modules/users/user.types';
import { AppError } from '../utils/AppError';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;
  if (!token) {
    next(new AppError('Authentication required', 401));
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('Invalid or expired session', 401));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError('You do not have permission to perform this action', 403));
      return;
    }
    next();
  };
}
