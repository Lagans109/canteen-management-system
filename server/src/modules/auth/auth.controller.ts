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

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const { token, user } = await loginService(input);
  res.cookie(env.COOKIE_NAME, token, cookieOptions());
  res.status(200).json({ user: toUserPublic(user) });
});

export const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(env.COOKIE_NAME, cookieOptions());
  res.status(200).json({ message: 'Logged out' });
});

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
