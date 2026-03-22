import request from 'supertest';
import express, { Express } from 'express';
import authRoutes from '../routes/auth.routes';
import { errorHandler } from '../middleware/error';

// Mock the OTP service
jest.mock('../services/otp', () => ({
  sendOtp: jest.fn().mockImplementation((mobile: string) => {
    if (process.env.NODE_ENV === 'dev') {
      return Promise.resolve({ success: true, testOtp: '123456' });
    }
    return Promise.resolve({ success: true });
  }),
  verifyOtp: jest.fn().mockImplementation((mobile: string, otp: string) => {
    if (otp === '123456') {
      return Promise.resolve({ success: true });
    }
    return Promise.resolve({ success: false, error: 'Invalid OTP', errorCode: 'INVALID_OTP' });
  }),
}));

// Mock DynamoDB for worker lookup
const mockDynamoDbSend = jest.fn().mockResolvedValue({ Items: [] });
jest.mock('../services/dynamodb', () => ({
  dynamodb: {
    send: (...args: unknown[]) => mockDynamoDbSend(...args),
  },
  Tables: {
    WORKERS: 'test-workers-table',
  },
}));

// Mock QueryCommand
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  QueryCommand: jest.fn(),
}));

// Mock JWT generation
jest.mock('../middleware/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

describe('Auth Routes', () => {
  let app: Express;
  const originalEnv = process.env;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('POST /api/auth/send-otp', () => {
    describe('Happy Path', () => {
      it('should return 200 when valid mobile number is provided', async () => {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile: '9876543210' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('OTP sent successfully');
        expect(response.body.data.mobile).toBe('9876543210');
      });

      it('should include test OTP in dev mode', async () => {
        process.env.NODE_ENV = 'dev';

        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile: '9876543210' });

        expect(response.status).toBe(200);
        expect(response.body.data.testOtp).toBe('123456');
      });

      it('should not include test OTP in production mode', async () => {
        process.env.NODE_ENV = 'production';

        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile: '9876543210' });

        expect(response.status).toBe(200);
        expect(response.body.data.testOtp).toBeUndefined();
      });

      it('should accept all valid Indian mobile numbers starting with 6-9', async () => {
        const validNumbers = ['6000000000', '7000000000', '8000000000', '9000000000'];

        for (const mobile of validNumbers) {
          const response = await request(app)
            .post('/api/auth/send-otp')
            .send({ mobile });

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      });
    });

    describe('Edge Cases - Validation', () => {
      it('should return 400 when mobile number is missing', async () => {
        const response = await request(app).post('/api/auth/send-otp').send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when mobile number has less than 10 digits', async () => {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile: '987654321' }); // 9 digits

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toMatch(/Invalid Indian mobile number/);
      });

      it('should return 400 when mobile number has more than 10 digits', async () => {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile: '98765432100' }); // 11 digits

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when mobile number starts with 0-5', async () => {
        const invalidNumbers = ['0123456789', '1234567890', '2345678901', '3456789012', '4567890123', '5678901234'];

        for (const mobile of invalidNumbers) {
          const response = await request(app)
            .post('/api/auth/send-otp')
            .send({ mobile });

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
        }
      });

      it('should return 400 when mobile number contains non-numeric characters', async () => {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile: '98765ABCDE' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when mobile is empty string', async () => {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 when mobile is a number instead of string', async () => {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile: 9876543210 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 when request body is empty', async () => {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send();

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 when request has extra unknown fields (strict mode)', async () => {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ mobile: '9876543210', extraField: 'should fail' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    describe('Happy Path', () => {
      it('should return 200 when valid OTP is provided', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ mobile: '9876543210', otp: '123456' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('OTP verified successfully');
        expect(response.body.data.token).toBeDefined();
        expect(response.body.data.user).toBeDefined();
      });

      it('should return token when OTP is correct', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ mobile: '9876543210', otp: '123456' });

        expect(response.status).toBe(200);
        expect(response.body.data.token).toBe('mock-jwt-token');
      });

      it('should return user info on successful verification', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ mobile: '9876543210', otp: '123456' });

        expect(response.status).toBe(200);
        expect(response.body.data.user.mobile).toBe('9876543210');
        expect(response.body.data.user.isNewUser).toBeDefined();
      });
    });

    describe('Edge Cases - Validation', () => {
      it('should return 400 when mobile is missing', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ otp: '123456' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when OTP is missing', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ mobile: '9876543210' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when OTP is less than 6 digits', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ mobile: '9876543210', otp: '12345' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when OTP is more than 6 digits', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ mobile: '9876543210', otp: '1234567' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when OTP contains non-numeric characters', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ mobile: '9876543210', otp: '12ABCD' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 422 when OTP is incorrect', async () => {
        process.env.NODE_ENV = 'production';
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ mobile: '9876543210', otp: '000000' });

        expect(response.status).toBe(422);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_OTP');
      });

      it('should return 400 when mobile number format is invalid', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ mobile: '1234567890', otp: '123456' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when request body is empty', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send();

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 when both fields are missing', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
