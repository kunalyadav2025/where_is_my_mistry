/**
 * SMS Service
 * Currently mocked for development. Replace with actual Pinpoint implementation for production.
 */

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendOtp(mobile: string, otp: string): Promise<SendOtpResult> {
  const message = `Your Where is My Mistry verification code is: ${otp}. Valid for 5 minutes.`;

  // In development, just log the OTP
  if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development') {
    console.log(`[MOCK SMS] To: +91${mobile}`);
    console.log(`[MOCK SMS] Message: ${message}`);
    console.log(`[MOCK SMS] OTP: ${otp}`);

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  // TODO: Implement actual Pinpoint SMS sending
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

  console.warn('[SMS] Production SMS not implemented yet');
  return {
    success: false,
    error: 'Production SMS not implemented',
  };
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
