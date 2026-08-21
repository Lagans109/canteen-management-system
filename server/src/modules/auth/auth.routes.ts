import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { loginRateLimiter } from '../../middlewares/rateLimit';
import { loginSchema } from './auth.validation';
import { loginHandler, logoutHandler, meHandler } from './auth.controller';

export const authRouter = Router();

// Logs a user in. Rate-limited to slow down brute-force attempts, and
// validated so the controller only ever sees a well-formed {email, password}.
authRouter.post('/login', loginRateLimiter, validate(loginSchema), loginHandler);

// Clears the auth cookie. No auth required — logging out an already
// logged-out (or never logged-in) client is harmless.
authRouter.post('/logout', logoutHandler);

// Returns the currently authenticated user, used by the frontend on page
// load to restore the session from the auth cookie without requiring a
// fresh login every time the app is opened.
authRouter.get('/me', requireAuth, meHandler);
