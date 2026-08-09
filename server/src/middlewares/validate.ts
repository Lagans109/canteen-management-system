import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type Target = 'body' | 'query' | 'params';

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
