// A custom error type for expected, business-level failures (e.g. "Category
// not found", "Invalid email or password"). Controllers/services throw this
// with an explicit HTTP status code, and the central error handler
// (middlewares/errorHandler.ts) knows to send that status + message
// straight to the client, instead of the generic 500 used for unexpected errors.
export class AppError extends Error {
  public readonly statusCode: number;
  // Marks this as a "known" error we deliberately threw, as opposed to a
  // bug/crash — useful if the error handler ever needs to distinguish them.
  public readonly isOperational = true;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // Needed because TypeScript's downleveled class extension of built-ins
    // (like Error) can otherwise break `instanceof AppError` checks.
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
