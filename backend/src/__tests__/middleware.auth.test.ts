import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  authenticate,
  requireRole,
  generateToken,
  verifyToken,
  AuthRequest,
  JwtPayload,
} from '../middleware/auth';

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;
    mockNext = jest.fn();
    mockRequest = {
      headers: {},
    } as Partial<AuthRequest>;
  });

  describe('authenticate', () => {
    it('should return 401 when no authorization header is provided', () => {
      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', () => {
      mockRequest.headers = { authorization: 'InvalidToken' };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { mobile: '9876543210', role: 'worker' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '0s' }
      );

      // Wait a bit to ensure token expires
      await new Promise(resolve => setTimeout(resolve, 100));

      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next and attach user to request when token is valid', () => {
      const payload = {
        mobile: '9876543210',
        role: 'worker' as const,
        workerId: 'worker-123',
      };
      const validToken = generateToken(payload);

      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.mobile).toBe(payload.mobile);
      expect(mockRequest.user?.role).toBe(payload.role);
      expect(mockRequest.user?.workerId).toBe(payload.workerId);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle admin tokens correctly', () => {
      const payload = {
        mobile: '9876543210',
        role: 'admin' as const,
        adminId: 'admin-123',
      };
      const validToken = generateToken(payload);

      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user?.role).toBe('admin');
      expect(mockRequest.user?.adminId).toBe('admin-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle user tokens correctly', () => {
      const payload = {
        mobile: '9876543210',
        role: 'user' as const,
      };
      const validToken = generateToken(payload);

      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user?.role).toBe('user');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should return 401 when user is not authenticated', () => {
      const middleware = requireRole('worker');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user role does not match', () => {
      mockRequest.user = {
        mobile: '9876543210',
        role: 'user',
        iat: Date.now(),
        exp: Date.now() + 1000,
      };

      const middleware = requireRole('worker');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next when user role matches', () => {
      mockRequest.user = {
        mobile: '9876543210',
        role: 'worker',
        workerId: 'worker-123',
        iat: Date.now(),
        exp: Date.now() + 1000,
      };

      const middleware = requireRole('worker');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should accept multiple roles', () => {
      mockRequest.user = {
        mobile: '9876543210',
        role: 'admin',
        adminId: 'admin-123',
        iat: Date.now(),
        exp: Date.now() + 1000,
      };

      const middleware = requireRole('worker', 'admin');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject when role is not in allowed list', () => {
      mockRequest.user = {
        mobile: '9876543210',
        role: 'user',
        iat: Date.now(),
        exp: Date.now() + 1000,
      };

      const middleware = requireRole('worker', 'admin');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        mobile: '9876543210',
        role: 'worker' as const,
        workerId: 'worker-123',
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with correct payload', () => {
      const payload = {
        mobile: '9876543210',
        role: 'worker' as const,
        workerId: 'worker-123',
      };

      const token = generateToken(payload);
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'test-secret-key'
      ) as JwtPayload;

      expect(decoded.mobile).toBe(payload.mobile);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.workerId).toBe(payload.workerId);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should generate token with admin payload', () => {
      const payload = {
        mobile: '9876543210',
        role: 'admin' as const,
        adminId: 'admin-123',
      };

      const token = generateToken(payload);
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'test-secret-key'
      ) as JwtPayload;

      expect(decoded.role).toBe('admin');
      expect(decoded.adminId).toBe('admin-123');
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { mobile: '9876543210', role: 'worker' as const };
      const payload2 = { mobile: '8765432109', role: 'worker' as const };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should return payload for valid token', () => {
      const payload = {
        mobile: '9876543210',
        role: 'worker' as const,
        workerId: 'worker-123',
      };

      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.mobile).toBe(payload.mobile);
      expect(verified?.role).toBe(payload.role);
      expect(verified?.workerId).toBe(payload.workerId);
    });

    it('should return null for invalid token', () => {
      const verified = verifyToken('invalid-token');

      expect(verified).toBeNull();
    });

    it('should return null for expired token', async () => {
      const expiredToken = jwt.sign(
        { mobile: '9876543210', role: 'worker' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '0s' }
      );

      // Wait a bit to ensure token expires
      await new Promise(resolve => setTimeout(resolve, 100));

      const verified = verifyToken(expiredToken);
      expect(verified).toBeNull();
    });

    it('should return null for malformed token', () => {
      const verified = verifyToken('not.a.valid.jwt.token');

      expect(verified).toBeNull();
    });
  });
});
