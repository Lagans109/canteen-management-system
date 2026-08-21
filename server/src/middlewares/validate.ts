import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type Target = 'body' | 'query' | 'params';

// Generic request-validation middleware factory. Given a Zod schema and
// which part of the request to check (defaults to the JSON body, but
// routes also use 'query' for list/report filters), it:
//   1. Rejects the request with a 400 AppError if validation fails,
//      combining every field's error into one readable message.
//   2. On success, replaces req[target] with Zod's parsed/coerced data
//      (e.g. query string "2" becomes the number 2), so controllers can
//      trust the shape and types without re-checking them.
// This keeps validation rules declared once per module (in *.validation.ts)
// instead of scattered through controllers.
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.') || target}: ${issue.message}`)
        .join('; ');
      next(new AppError(message, 400));
      return;
    }
    (req as unknown as Record<Target, unknown>)[target] = result.data;
    next();
  };
}
