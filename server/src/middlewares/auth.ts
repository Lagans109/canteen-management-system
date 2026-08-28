import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { verifyToken, type JwtPayload } from '../modules/auth/jwt';
import { AppError } from '../utils/AppError';

// Extends Express's Request type with an optional `user` field so
// downstream handlers get typed access to the authenticated user's
// JWT payload (id + role) after requireAuth has run.
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Authentication gate: reads the JWT from the httpOnly auth cookie, verifies
// its signature/expiry, and attaches the decoded payload to `req.user`.
// Any route that needs a logged-in user (of any role) uses this middleware.
// Responds 401 if the cookie is missing or the token is invalid/expired.
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

