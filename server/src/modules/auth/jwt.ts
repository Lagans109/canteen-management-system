import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import type { Role } from '../users/user.types';

// What gets encoded inside the JWT: the user's id (`sub`, JWT convention for
// "subject") and their role. `role` is carried purely as a display label
// (shown in the admin topbar) — it plays no part in access control, since
// OWNER and CASHIER have identical permissions. Kept minimal — no
// name/email — so the token stays small.
export interface JwtPayload {
  sub: string;
  role: Role;
}

// Signs a new JWT for a logged-in user, using JWT_SECRET and expiring after
// JWT_EXPIRES_IN (e.g. "1d"). This token is what gets stored in the auth cookie.
export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

// Verifies a JWT's signature and expiry, returning its decoded payload.
// Throws if the token is missing, tampered with, or expired — callers
// (requireAuth) catch that and respond with 401.
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
