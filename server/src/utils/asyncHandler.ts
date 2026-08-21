import type { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express does not automatically catch rejected Promises thrown inside
// `async` route handlers — an unhandled rejection would crash the process
// instead of producing an HTTP error response. Wrapping every async
// controller with this function forwards any thrown/rejected error to
// `next(err)`, so it reaches the central error handler like any other error.
export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
