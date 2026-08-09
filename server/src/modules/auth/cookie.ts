import type { CookieOptions } from 'express';
import { env } from '../../config/env';

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Parses simple jsonwebtoken-style durations ("1d", "15m", "2h", "30s", or plain seconds). */
function parseDurationToMs(duration: string): number | null {
  const numeric = Number(duration);
  if (!Number.isNaN(numeric) && duration.trim() !== '') {
    return numeric * 1000;
  }

  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(duration.trim());
  if (!match) return null;

  const value = Number(match[1]);
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const unit = match[2]?.toLowerCase() ?? 's';
  return value * (unitMs[unit] ?? 1000);
}

export function cookieOptions(): CookieOptions {
  const maxAge = parseDurationToMs(env.JWT_EXPIRES_IN) ?? DEFAULT_MAX_AGE_MS;
  const sameSite = env.COOKIE_SAME_SITE;

  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite,
    maxAge,
    path: '/',
  };
}
