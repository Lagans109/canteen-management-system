import { describe, expect, it, vi } from 'vitest';
import { hashPassword, comparePassword } from '../src/modules/auth/password';
import { signToken, verifyToken } from '../src/modules/auth/jwt';
import { loginSchema } from '../src/modules/auth/auth.validation';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../src/middlewares/auth';
import { AppError } from '../src/utils/AppError';

describe('password hashing', () => {
  it('hashes a password and verifies a correct match', async () => {
    const hash = await hashPassword('correct-password');
    expect(hash).not.toBe('correct-password');
    await expect(comparePassword('correct-password', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('correct-password');
    await expect(comparePassword('wrong-password', hash)).resolves.toBe(false);
  });
});

describe('jwt', () => {
  it('signs and verifies a token round-trip', () => {
    const token = signToken({ sub: '123', role: 'OWNER' });
    const payload = verifyToken(token);
    expect(payload.sub).toBe('123');
    expect(payload.role).toBe('OWNER');
  });

  it('throws on an invalid token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });
});

describe('loginSchema', () => {
  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({ email: 'Owner@Example.com', password: 'secret' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('owner@example.com');
    }
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'owner@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

function mockRes() {
  return {} as never;
}

describe('requireAuth middleware', () => {
  it('rejects requests with no cookie', () => {
    const req = { cookies: {} } as unknown as AuthenticatedRequest;
    const next = vi.fn();
    requireAuth(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0]?.[0] as AppError;
    expect(err.statusCode).toBe(401);
  });

  it('attaches the decoded user for a valid cookie', () => {
    const token = signToken({ sub: 'abc', role: 'CASHIER' });
    const req = { cookies: { canteen_token: token } } as unknown as AuthenticatedRequest;
    const next = vi.fn();
    requireAuth(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({ sub: 'abc', role: 'CASHIER' });
  });

  it('rejects an invalid cookie token', () => {
    const req = { cookies: { canteen_token: 'garbage' } } as unknown as AuthenticatedRequest;
    const next = vi.fn();
    requireAuth(req, mockRes(), next);
    const err = next.mock.calls[0]?.[0] as AppError;
    expect(err.statusCode).toBe(401);
  });
});

describe('requireRole middleware', () => {
  it('allows a user with an allowed role', () => {
    const req = { user: { sub: '1', role: 'OWNER' } } as unknown as AuthenticatedRequest;
    const next = vi.fn();
    requireRole('OWNER', 'CASHIER')(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks a user without an allowed role', () => {
    const req = { user: { sub: '1', role: 'CASHIER' } } as unknown as AuthenticatedRequest;
    const next = vi.fn();
    requireRole('OWNER')(req, mockRes(), next);
    const err = next.mock.calls[0]?.[0] as AppError;
    expect(err.statusCode).toBe(403);
  });

  it('blocks an unauthenticated request', () => {
    const req = {} as unknown as AuthenticatedRequest;
    const next = vi.fn();
    requireRole('OWNER')(req, mockRes(), next);
    const err = next.mock.calls[0]?.[0] as AppError;
    expect(err.statusCode).toBe(401);
  });
});
