import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '../types/index.js';

export function notFoundHandler(_req: Request, res: Response) {
  const body: ApiError = {
    success: false,
    error: 'Not Found',
  };
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err);

  const message =
    err instanceof Error ? err.message : 'Internal Server Error';

  const body: ApiError = {
    success: false,
    error: message,
    details:
      process.env.NODE_ENV === 'development' && err instanceof Error
        ? { stack: err.stack }
        : undefined,
  };

  const status =
    err && typeof err === 'object' && 'status' in err
      ? Number((err as { status: number }).status)
      : 500;

  res.status(status >= 400 && status < 600 ? status : 500).json(body);
}
