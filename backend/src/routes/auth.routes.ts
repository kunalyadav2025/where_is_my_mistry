import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// Validation schemas
const sendOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
});

const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = sendOtpSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 'VALIDATION_ERROR', validation.error.errors[0].message, 400);
    }

    const { mobile } = validation.data;

    // TODO: Implement OTP generation and sending
    // For now, return success (mocked)
    console.log(`[MOCK] Sending OTP to ${mobile}`);

    return successResponse(res, {
      message: 'OTP sent successfully',
      mobile,
      // In dev mode, return a test OTP
      ...(process.env.NODE_ENV === 'dev' && { testOtp: '123456' }),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = verifyOtpSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 'VALIDATION_ERROR', validation.error.errors[0].message, 400);
    }

    const { mobile, otp } = validation.data;

    // TODO: Implement OTP verification and JWT generation
    // For now, accept any OTP in dev mode
    if (process.env.NODE_ENV === 'dev' || otp === '123456') {
      return successResponse(res, {
        message: 'OTP verified successfully',
        token: 'mock-jwt-token',
        user: {
          mobile,
          isNewUser: true,
        },
      });
    }

    return errorResponse(res, 'INVALID_OTP', 'The OTP is invalid or expired', 401);
  } catch (error) {
    next(error);
  }
});

export default router;
