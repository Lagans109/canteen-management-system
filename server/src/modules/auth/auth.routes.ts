import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { loginRateLimiter } from '../../middlewares/rateLimit';
import { loginSchema } from './auth.validation';
import { loginHandler, logoutHandler, meHandler } from './auth.controller';

export const authRouter = Router();

authRouter.post('/login', loginRateLimiter, validate(loginSchema), loginHandler);
authRouter.post('/logout', logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
