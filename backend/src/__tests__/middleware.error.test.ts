import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  createError,
  notFoundError,
  validationError,
  unauthorizedError,
  forbiddenError,
  AppError,
} from '../middleware/error';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  const originalEnv = process.env;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
    mockNext = jest.fn();
    mockRequest = {
      path: '/test/path',
      method: 'GET',
    } as Partial<Request>;
    console.error = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('errorHandler', () => {
    it('should return error with custom status code', () => {
      const error: AppError = {
        name: 'TestError',
        message: 'Test error message',
        statusCode: 400,
        code: 'TEST_ERROR',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
        },
      });
    });

    it('should default to 500 status code when not provided', () => {
      const error: AppError = {
        name: 'TestError',
        message: 'Test error message',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should default to INTERNAL_ERROR code when not provided', () => {
      const error: AppError = {
        name: 'TestError',
        message: 'Test error message',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Test error message',
        },
      });
    });

    it('should include stack trace in development mode', () => {
      process.env.NODE_ENV = 'dev';
      const error: AppError = {
        name: 'TestError',
        message: 'Test error message',
        stack: 'Error stack trace',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Test error message',
          stack: 'Error stack trace',
        },
      });
    });

    it('should not include stack trace in production mode', () => {
      process.env.NODE_ENV = 'prod';
      const error: AppError = {
        name: 'TestError',
        message: 'Test error message',
        statusCode: 400,
        stack: 'Error stack trace',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const call = jsonMock.mock.calls[0][0];
      expect(call.error.stack).toBeUndefined();
    });

    it('should hide internal error messages in production', () => {
      process.env.NODE_ENV = 'prod';
      const error: AppError = {
        name: 'TestError',
        message: 'Sensitive internal error',
        statusCode: 500,
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });

    it('should show error messages for non-500 errors in production', () => {
      process.env.NODE_ENV = 'prod';
      const error: AppError = {
        name: 'TestError',
        message: 'Validation failed',
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        },
      });
    });

    it('should log error details to console', () => {
      const error: AppError = {
        name: 'TestError',
        message: 'Test error message',
        code: 'TEST_ERROR',
        stack: 'Error stack',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.error).toHaveBeenCalledWith(
        'Error:',
        expect.objectContaining({
          message: 'Test error message',
          code: 'TEST_ERROR',
          path: '/test/path',
          method: 'GET',
        })
      );
    });
  });

  describe('createError', () => {
    it('should create error with provided parameters', () => {
      const error = createError('Test message', 'TEST_CODE', 418);

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(418);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with stack trace', () => {
      const error = createError('Test message', 'TEST_CODE', 400);

      expect(error.stack).toBeDefined();
    });
  });

  describe('notFoundError', () => {
    it('should create 404 error', () => {
      const error = notFoundError('Worker');

      expect(error.message).toBe('Worker not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    it('should create 404 error for different resources', () => {
      const error1 = notFoundError('User');
      const error2 = notFoundError('Photo');

      expect(error1.message).toBe('User not found');
      expect(error2.message).toBe('Photo not found');
    });
  });

  describe('validationError', () => {
    it('should create 400 validation error', () => {
      const error = validationError('Invalid mobile number');

      expect(error.message).toBe('Invalid mobile number');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('should create validation error with custom message', () => {
      const error = validationError('Field is required');

      expect(error.message).toBe('Field is required');
    });
  });

  describe('unauthorizedError', () => {
    it('should create 401 unauthorized error with default message', () => {
      const error = unauthorizedError();

      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
    });

    it('should create 401 unauthorized error with custom message', () => {
      const error = unauthorizedError('Invalid credentials');

      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('forbiddenError', () => {
    it('should create 403 forbidden error with default message', () => {
      const error = forbiddenError();

      expect(error.message).toBe('Forbidden');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });

    it('should create 403 forbidden error with custom message', () => {
      const error = forbiddenError('Insufficient permissions');

      expect(error.message).toBe('Insufficient permissions');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });
  });
});
