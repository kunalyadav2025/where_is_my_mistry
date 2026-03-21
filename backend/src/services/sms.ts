/**
 * SMS Service
 * Currently mocked for development. Replace with actual Pinpoint implementation for production.
 */

import { logger, maskMobile } from '../utils/logger';

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS message
 * Currently mocked - implement Pinpoint in production
 */
export async function sendSms(mobile: string, message: string): Promise<SendSmsResult> {
  // In development, just log (without exposing sensitive data)
  if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development') {
    logger.debug('Mock SMS sent', {
      mobile: maskMobile(mobile),
      messageLength: message.length,
    });

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  // TODO: Implement actual Pinpoint SMS sending for production
  // import { PinpointClient, SendMessagesCommand } from '@aws-sdk/client-pinpoint';
  //
  // const pinpointClient = new PinpointClient({ region: process.env.AWS_REGION });
  // const params = {
  //   ApplicationId: process.env.PINPOINT_APP_ID,
  //   MessageRequest: {
  //     Addresses: {
  //       [`+91${mobile}`]: { ChannelType: 'SMS' },
  //     },
  //     MessageConfiguration: {
  //       SMSMessage: {
  //         Body: message,
  //         MessageType: 'TRANSACTIONAL',
  //         OriginationNumber: process.env.PINPOINT_ORIGINATION_NUMBER,
  //       },
  //     },
  //   },
  // };

  logger.warn('Production SMS not implemented', { mobile: maskMobile(mobile) });

  return {
    success: false,
    error: 'Production SMS not implemented',
  };
}

/**
 * Generate a 6-digit OTP
 * @deprecated Use otp.ts generateOtp instead
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
