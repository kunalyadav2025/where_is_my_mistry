import { sendSms, generateOtp } from '../services/sms';

describe('SMS Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = generateOtp();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs on consecutive calls', () => {
      const otp1 = generateOtp();
      const otp2 = generateOtp();
      const otp3 = generateOtp();

      // There's a tiny chance they could be the same, but very unlikely
      const allOtps = [otp1, otp2, otp3];
      const uniqueOtps = new Set(allOtps);
      expect(uniqueOtps.size).toBeGreaterThan(1);
    });

    it('should generate OTPs within valid range (100000-999999)', () => {
      for (let i = 0; i < 10; i++) {
        const otp = generateOtp();
        const otpNum = parseInt(otp, 10);
        expect(otpNum).toBeGreaterThanOrEqual(100000);
        expect(otpNum).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('sendSms', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      console.log = jest.fn();
      console.warn = jest.fn();
    });

    it('should return success in development mode', async () => {
      process.env.NODE_ENV = 'dev';
      const mobile = '9876543210';
      const message = 'Your OTP is 123456';

      const result = await sendSms(mobile, message);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^mock-/);
      expect(result.error).toBeUndefined();
    });

    it('should succeed in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const mobile = '9876543210';
      const message = 'Your OTP is 654321';

      const result = await sendSms(mobile, message);

      // Should succeed in dev mode
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should return failure in production mode (not implemented)', async () => {
      process.env.NODE_ENV = 'production';
      const mobile = '9876543210';
      const message = 'Your OTP is 123456';

      const result = await sendSms(mobile, message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Production SMS not implemented');
    });

    it('should handle different mobile numbers', async () => {
      process.env.NODE_ENV = 'dev';
      const mobiles = ['9876543210', '8765432109', '7654321098'];

      for (const mobile of mobiles) {
        const result = await sendSms(mobile, 'Test message');
        expect(result.success).toBe(true);
      }
    });

    it('should generate unique message IDs', async () => {
      process.env.NODE_ENV = 'dev';

      const result1 = await sendSms('9876543210', 'Test 1');
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 2));
      const result2 = await sendSms('9876543210', 'Test 2');

      expect(result1.messageId).toBeDefined();
      expect(result2.messageId).toBeDefined();
      expect(result1.messageId).not.toBe(result2.messageId);
    });
  });
});
