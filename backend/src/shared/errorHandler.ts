/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors from route handlers and formats them
 * into consistent JSON error responses.
 */

import { NextFunction, Request, Response } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  console.error(`[ERROR] ${statusCode} — ${message}`, {
    stack: err.stack,
    code: err.code,
  });

  // Map known domain errors to HTTP status codes
  if (message.includes('not found') || message.includes('No baseline')) {
    res.status(404).json({ error: message });
    return;
  }

  if (message.includes('Cannot bank surplus') ||
      message.includes('No banked surplus') ||
      message.includes('No compliance record') ||
      message.includes('A pool must have')) {
    res.status(422).json({ error: message });
    return;
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Async error wrapper — allows async route handlers to propagate errors
 * to the global error handler without try/catch in every controller.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
