import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error:', {
    message: err.message,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Don't expose internal errors in production
  const responseMessage = statusCode === 500 && process.env.NODE_ENV === 'prod'
    ? 'An unexpected error occurred'
    : message;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: responseMessage,
      ...(process.env.NODE_ENV === 'dev' && { stack: err.stack }),
    },
  });
}

export function createError(message: string, code: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export function notFoundError(resource: string): AppError {
  return createError(`${resource} not found`, 'NOT_FOUND', 404);
}

export function validationError(message: string): AppError {
  return createError(message, 'VALIDATION_ERROR', 400);
}

export function unauthorizedError(message = 'Unauthorized'): AppError {
  return createError(message, 'UNAUTHORIZED', 401);
}

export function forbiddenError(message = 'Forbidden'): AppError {
  return createError(message, 'FORBIDDEN', 403);
}
