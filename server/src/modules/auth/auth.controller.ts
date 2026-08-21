import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { User } from '../users/user.model';
import { toUserPublic } from '../users/user.service';
import { login as loginService } from './auth.service';
import { cookieOptions } from './cookie';
import type { LoginInput } from './auth.validation';
import type { AuthenticatedRequest } from '../../middlewares/auth';

// POST /api/auth/login
// Request body (already validated by the loginSchema middleware): { email, password }.
// Delegates the actual credential check + JWT creation to auth.service.ts,
// then sends the token back as an httpOnly cookie (never in the JSON body,
// so client-side JavaScript can never read or leak it) along with the
// public user profile the frontend needs to render the UI.
export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const { token, user } = await loginService(input);
  res.cookie(env.COOKIE_NAME, token, cookieOptions());
  res.status(200).json({ user: toUserPublic(user) });
});

// POST /api/auth/logout
// Simply clears the auth cookie on the client. There's no server-side
// session/token store to invalidate — the JWT just naturally expires on
// its own after JWT_EXPIRES_IN even if the client kept it.
export const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(env.COOKIE_NAME, cookieOptions());
  res.status(200).json({ message: 'Logged out' });
});

// GET /api/auth/me
// Requires requireAuth to have already verified the cookie and populated
// req.user. Re-fetches the user from the database (rather than trusting the
// JWT payload alone) so the response reflects the current name/role/active
// status, not what it was when the token was issued.
export const meHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  const user = await User.findById(req.user.sub);
  if (!user) {
    throw new AppError('Authentication required', 401);
  }
  res.status(200).json({ user: toUserPublic(user) });
});
