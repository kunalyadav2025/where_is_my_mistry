// Test setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';
process.env.AWS_REGION = 'ap-south-1';
process.env.DYNAMODB_WORKERS_TABLE = 'test-workers';
process.env.DYNAMODB_PHOTOS_TABLE = 'test-photos';
process.env.DYNAMODB_REVIEWS_TABLE = 'test-reviews';
process.env.DYNAMODB_LOCATIONS_TABLE = 'test-locations';
process.env.DYNAMODB_CATEGORIES_TABLE = 'test-categories';
process.env.DYNAMODB_OTP_TABLE = 'test-otp';
process.env.DYNAMODB_ADMINS_TABLE = 'test-admins';
process.env.S3_BUCKET_NAME = 'test-bucket';

// Suppress console logs during tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: console.error, // Keep error logs visible
};
