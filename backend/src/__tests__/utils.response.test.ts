import { Response } from 'express';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';

describe('Response Utilities', () => {
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
  });

  describe('successResponse', () => {
    it('should return success response with default 200 status code', () => {
      const data = { message: 'Success' };
      successResponse(mockResponse as Response, data);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should return success response with custom status code', () => {
      const data = { id: '123', name: 'Test' };
      successResponse(mockResponse as Response, data, 201);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should handle null data', () => {
      successResponse(mockResponse as Response, null);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
    });

    it('should handle complex nested data structures', () => {
      const data = {
        user: {
          id: '123',
          profile: {
            name: 'Test User',
            settings: { theme: 'dark' },
          },
        },
        items: [1, 2, 3],
      };
      successResponse(mockResponse as Response, data);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });
  });

  describe('paginatedResponse', () => {
    it('should return paginated response with pagination metadata', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 20,
        total: 100,
        hasMore: true,
      };

      paginatedResponse(mockResponse as Response, data, pagination);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        pagination,
      });
    });

    it('should return paginated response with custom status code', () => {
      const data: unknown[] = [];
      const pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      };

      paginatedResponse(mockResponse as Response, data, pagination, 201);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        pagination,
      });
    });

    it('should handle last page correctly', () => {
      const data = [{ id: 91 }, { id: 92 }];
      const pagination = {
        page: 5,
        limit: 20,
        total: 92,
        hasMore: false,
      };

      paginatedResponse(mockResponse as Response, data, pagination);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        pagination,
      });
    });
  });

  describe('errorResponse', () => {
    it('should return error response with default 500 status code', () => {
      errorResponse(mockResponse as Response, 'INTERNAL_ERROR', 'Something went wrong');

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
      });
    });

    it('should return error response with 400 for validation errors', () => {
      errorResponse(
        mockResponse as Response,
        'VALIDATION_ERROR',
        'Invalid input',
        400
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
      });
    });

    it('should return error response with 401 for unauthorized', () => {
      errorResponse(mockResponse as Response, 'UNAUTHORIZED', 'No token provided', 401);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
    });

    it('should return error response with 403 for forbidden', () => {
      errorResponse(
        mockResponse as Response,
        'FORBIDDEN',
        'Insufficient permissions',
        403
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    });

    it('should return error response with 404 for not found', () => {
      errorResponse(mockResponse as Response, 'NOT_FOUND', 'Resource not found', 404);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      });
    });
  });
});
