import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

// Public, unauthenticated menu reads are excluded from the general API
// rate limit below (see `skip`) because many different students/devices
// legitimately hit these same two GET endpoints throughout the day.
const PUBLIC_MENU_PATHS = new Set(['/menu', '/menu/categories']);

function isPublicMenuRead(req: Request): boolean {
  return req.method === 'GET' && PUBLIC_MENU_PATHS.has(req.path);
}

// Stricter limiter applied only to the login endpoint: at most 10 attempts
// per IP every 15 minutes. This slows down password-guessing/brute-force attacks.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

// General-purpose limiter applied to the whole /api router in app.ts, to
// protect the backend from being overwhelmed (accidentally or maliciously)
// by any single client. Public menu GETs are skipped since they're
// expected to be called frequently by many anonymous visitors.
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isPublicMenuRead,
  message: { message: 'Too many requests. Please try again later.' },
});
