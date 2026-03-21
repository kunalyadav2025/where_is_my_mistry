import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse } from '../utils/response';
import { sendOtp, verifyOtp } from '../services/otp';
import { generateToken } from '../middleware/auth';
import { dynamodb, Tables } from '../services/dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

const router = Router();

// Validation schemas with strict mode to reject unknown fields
const sendOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
}).strict();

const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
}).strict();

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body exists
    if (!req.body || typeof req.body !== 'object') {
      return errorResponse(res, 'VALIDATION_ERROR', 'Request body must be a JSON object', 400);
    }

    const validation = sendOtpSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 'VALIDATION_ERROR', validation.error.errors[0].message, 400);
    }

    const { mobile } = validation.data;

    const result = await sendOtp(mobile);

    if (!result.success) {
      const statusCode = result.errorCode === 'RATE_LIMITED' ? 429 : 500;
      return errorResponse(res, result.errorCode || 'INTERNAL_ERROR', result.error || 'Failed to send OTP', statusCode);
    }

    return successResponse(res, {
      message: 'OTP sent successfully',
      mobile,
      ...(result.testOtp && { testOtp: result.testOtp }), // Only in dev mode
      ...(result.retryAfterSeconds && { retryAfterSeconds: result.retryAfterSeconds }),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body exists
    if (!req.body || typeof req.body !== 'object') {
      return errorResponse(res, 'VALIDATION_ERROR', 'Request body must be a JSON object', 400);
    }

    const validation = verifyOtpSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 'VALIDATION_ERROR', validation.error.errors[0].message, 400);
    }

    const { mobile, otp } = validation.data;

    const result = await verifyOtp(mobile, otp);

    if (!result.success) {
      // Use 422 for business logic failures (valid format but wrong value)
      // Use 410 for expired OTP
      let statusCode = 422;
      if (result.errorCode === 'OTP_EXPIRED') statusCode = 410;
      if (result.errorCode === 'NOT_FOUND') statusCode = 404;
      if (result.errorCode === 'MAX_ATTEMPTS') statusCode = 429;

      return errorResponse(res, result.errorCode || 'INVALID_OTP', result.error || 'Invalid OTP', statusCode);
    }

    // Check if user is an existing worker
    const workerResult = await dynamodb.send(
      new QueryCommand({
        TableName: Tables.WORKERS,
        IndexName: 'MobileIndex',
        KeyConditionExpression: 'mobile = :mobile',
        ExpressionAttributeValues: {
          ':mobile': mobile,
        },
        Limit: 1,
      })
    );

    const existingWorker = workerResult.Items?.[0];
    const isNewUser = !existingWorker;

    // Generate JWT token
    const token = generateToken({
      mobile,
      workerId: existingWorker?.workerId as string | undefined,
      role: existingWorker ? 'worker' : 'user',
    });

    return successResponse(res, {
      message: 'OTP verified successfully',
      token,
      user: {
        mobile,
        workerId: existingWorker?.workerId,
        role: existingWorker ? 'worker' : 'user',
        isNewUser,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
