import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export function successResponse<T>(
  res: Response,
  data: T,
  statusCode = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(response);
}

export function paginatedResponse<T>(
  res: Response,
  data: T,
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  },
  statusCode = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    pagination,
  };
  return res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  code: string,
  message: string,
  statusCode = 500
): Response {
  const response: ApiResponse = {
    success: false,
    error: { code, message },
  };
  return res.status(statusCode).json(response);
}
