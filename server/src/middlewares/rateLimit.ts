import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

const PUBLIC_MENU_PATHS = new Set(['/menu', '/menu/categories']);

function isPublicMenuRead(req: Request): boolean {
  return req.method === 'GET' && PUBLIC_MENU_PATHS.has(req.path);
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isPublicMenuRead,
  message: { message: 'Too many requests. Please try again later.' },
});
