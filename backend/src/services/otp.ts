/**
 * OTP Service
 * Handles OTP generation, storage, verification, and rate limiting
 */

import bcrypt from 'bcryptjs';
import { dynamodb, Tables } from './dynamodb';
import { QueryCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { logger, maskMobile } from '../utils/logger';
import { getEnvNumber } from '../utils/validateEnv';

const OTP_EXPIRY_SECONDS = getEnvNumber('OTP_EXPIRY_SECONDS', 300); // 5 minutes
const OTP_MAX_ATTEMPTS = getEnvNumber('OTP_MAX_ATTEMPTS', 5);
const RATE_LIMIT_OTP_SEND = getEnvNumber('RATE_LIMIT_OTP_SEND', 3); // Max OTPs per window
const RATE_LIMIT_OTP_WINDOW = getEnvNumber('RATE_LIMIT_OTP_WINDOW', 900); // 15 minutes

export interface OtpRecord {
  pk: string;
  sk: string;
  mobile: string;
  hashedOtp: string;
  attempts: number;
  expiresAt: number; // Epoch seconds for TTL
  createdAt: string;
}

export interface SendOtpResult {
  success: boolean;
  error?: string;
  errorCode?: 'RATE_LIMITED' | 'INTERNAL_ERROR';
  retryAfterSeconds?: number;
  testOtp?: string; // Only in dev mode
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
  errorCode?: 'INVALID_OTP' | 'OTP_EXPIRED' | 'MAX_ATTEMPTS' | 'NOT_FOUND';
}

/**
 * Generate a 6-digit OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if mobile has exceeded OTP send rate limit
 */
async function checkRateLimit(mobile: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const windowStart = Math.floor(Date.now() / 1000) - RATE_LIMIT_OTP_WINDOW;

  const result = await dynamodb.send(
    new QueryCommand({
      TableName: Tables.OTP,
      KeyConditionExpression: 'pk = :pk AND sk > :windowStart',
      ExpressionAttributeValues: {
        ':pk': `OTP#${mobile}`,
        ':windowStart': windowStart.toString(),
      },
    })
  );

  const recentOtps = result.Items || [];

  if (recentOtps.length >= RATE_LIMIT_OTP_SEND) {
    // Find the oldest OTP in the window to calculate retry time
    const oldestOtp = recentOtps.reduce((oldest, current) => {
      const currentSk = parseInt(current.sk as string, 10);
      const oldestSk = parseInt(oldest.sk as string, 10);
      return currentSk < oldestSk ? current : oldest;
    });

    const oldestTimestamp = parseInt(oldestOtp.sk as string, 10);
    const retryAfterSeconds = oldestTimestamp + RATE_LIMIT_OTP_WINDOW - Math.floor(Date.now() / 1000);

    return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 60) };
  }

  return { allowed: true };
}

/**
 * Send OTP to a mobile number
 */
export async function sendOtp(mobile: string): Promise<SendOtpResult> {
  try {
    // Check rate limit
    const rateCheck = await checkRateLimit(mobile);
    if (!rateCheck.allowed) {
      logger.warn('OTP rate limit exceeded', { mobile: maskMobile(mobile) });
      return {
        success: false,
        error: 'Too many OTP requests. Please try again later.',
        errorCode: 'RATE_LIMITED',
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      };
    }

    // Generate OTP
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + OTP_EXPIRY_SECONDS;

    // Store OTP record
    const otpRecord: OtpRecord = {
      pk: `OTP#${mobile}`,
      sk: now.toString(),
      mobile,
      hashedOtp,
      attempts: 0,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: Tables.OTP,
        Item: otpRecord,
      })
    );

    logger.info('OTP generated', { mobile: maskMobile(mobile) });

    // In dev mode, return the OTP for testing
    if (process.env.NODE_ENV === 'dev') {
      logger.debug('Dev mode OTP', { mobile: maskMobile(mobile), otp: '******' });
      return { success: true, testOtp: otp };
    }

    // TODO: Send actual SMS via Pinpoint in production
    // For now, just log that we would send
    logger.info('OTP SMS would be sent', { mobile: maskMobile(mobile) });

    return { success: true };
  } catch (error) {
    logger.error('Failed to send OTP', error as Error, { mobile: maskMobile(mobile) });
    return {
      success: false,
      error: 'Failed to send OTP. Please try again.',
      errorCode: 'INTERNAL_ERROR',
    };
  }
}

/**
 * Verify an OTP for a mobile number
 */
export async function verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResult> {
  try {
    const now = Math.floor(Date.now() / 1000);

    // Query for the most recent OTP for this mobile
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: Tables.OTP,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `OTP#${mobile}`,
        },
        ScanIndexForward: false, // Get newest first
        Limit: 1,
      })
    );

    const otpRecords = result.Items as OtpRecord[] | undefined;

    if (!otpRecords || otpRecords.length === 0) {
      logger.warn('No OTP found for verification', { mobile: maskMobile(mobile) });
      return {
        success: false,
        error: 'No OTP found. Please request a new OTP.',
        errorCode: 'NOT_FOUND',
      };
    }

    const otpRecord = otpRecords[0];

    // Check if OTP is expired
    if (otpRecord.expiresAt < now) {
      logger.warn('OTP expired', { mobile: maskMobile(mobile) });
      return {
        success: false,
        error: 'OTP has expired. Please request a new OTP.',
        errorCode: 'OTP_EXPIRED',
      };
    }

    // Check max attempts
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      logger.warn('OTP max attempts exceeded', { mobile: maskMobile(mobile), attempts: otpRecord.attempts });
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new OTP.',
        errorCode: 'MAX_ATTEMPTS',
      };
    }

    // Increment attempts atomically
    await dynamodb.send(
      new UpdateCommand({
        TableName: Tables.OTP,
        Key: { pk: otpRecord.pk, sk: otpRecord.sk },
        UpdateExpression: 'ADD attempts :inc',
        ExpressionAttributeValues: { ':inc': 1 },
      })
    );

    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.hashedOtp);

    if (!isValid) {
      logger.warn('Invalid OTP attempt', { mobile: maskMobile(mobile), attempts: otpRecord.attempts + 1 });
      return {
        success: false,
        error: 'Invalid OTP. Please try again.',
        errorCode: 'INVALID_OTP',
      };
    }

    // OTP is valid - delete all OTPs for this mobile
    await deleteAllOtpsForMobile(mobile);

    logger.info('OTP verified successfully', { mobile: maskMobile(mobile) });
    return { success: true };
  } catch (error) {
    logger.error('OTP verification failed', error as Error, { mobile: maskMobile(mobile) });
    return {
      success: false,
      error: 'Verification failed. Please try again.',
      errorCode: 'INVALID_OTP',
    };
  }
}

/**
 * Delete all OTP records for a mobile number
 */
async function deleteAllOtpsForMobile(mobile: string): Promise<void> {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: Tables.OTP,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `OTP#${mobile}`,
      },
    })
  );

  const otpRecords = result.Items || [];

  for (const record of otpRecords) {
    await dynamodb.send(
      new DeleteCommand({
        TableName: Tables.OTP,
        Key: { pk: record.pk, sk: record.sk },
      })
    );
  }
}
