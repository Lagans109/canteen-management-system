import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

// Registered after all real routes in app.ts — runs when no route matched
// the request, and turns that into a normal 404 AppError instead of
// Express's default HTML error page.
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// MongoDB raises error code 11000 when a unique-index constraint is
// violated (e.g. creating a Category or User with a name/email that
// already exists). This type guard lets the handler recognize that case.
function isDuplicateKeyError(err: unknown): err is { code: number; keyPattern?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000;
}

// Central Express error handler — registered last in app.ts (Express
// recognizes it as an error handler because it takes 4 arguments). Every
// error thrown or passed to next(err) anywhere in the app ends up here,
// so this is the single place that decides what status/message the client sees.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // Errors we deliberately threw (business rule violations) already carry
  // the right HTTP status and a safe, user-facing message.
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Thrown by Mongoose when a route parameter (e.g. an :id) isn't a valid
  // ObjectId — treated as a client input error, not a server failure.
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: 'Invalid identifier supplied' });
    return;
  }

  // Schema-level validation failures from Mongoose (separate from the Zod
  // validation middleware, which runs before the request even reaches the model).
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (isDuplicateKeyError(err)) {
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : undefined;
    res.status(409).json({ message: field ? `A record with this ${field} already exists` : 'Duplicate record' });
    return;
  }

  // Anything else is an unexpected/programming error. It's logged
  // server-side for debugging but never sent to the client — the response
  // only contains a generic message so internal details (stack traces,
  // library errors) are never leaked.
  if (env.NODE_ENV !== 'test') {
    console.error(err);
  }
  res.status(500).json({ message: 'Internal server error' });
}
