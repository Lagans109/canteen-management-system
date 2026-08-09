import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function isDuplicateKeyError(err: unknown): err is { code: number; keyPattern?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: 'Invalid identifier supplied' });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (isDuplicateKeyError(err)) {
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : undefined;
    res.status(409).json({ message: field ? `A record with this ${field} already exists` : 'Duplicate record' });
    return;
  }

  if (env.NODE_ENV !== 'test') {
    console.error(err);
  }
  res.status(500).json({ message: 'Internal server error' });
}
