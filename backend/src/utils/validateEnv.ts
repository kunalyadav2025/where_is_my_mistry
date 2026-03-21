/**
 * Environment variable validation
 * Called at application startup to fail fast if required variables are missing
 */

const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'DYNAMODB_WORKERS_TABLE',
  'DYNAMODB_PHOTOS_TABLE',
  'DYNAMODB_REVIEWS_TABLE',
  'DYNAMODB_LOCATIONS_TABLE',
  'DYNAMODB_CATEGORIES_TABLE',
  'DYNAMODB_OTP_TABLE',
  'DYNAMODB_ADMINS_TABLE',
  'S3_BUCKET_NAME',
] as const;

const OPTIONAL_ENV_VARS_WITH_DEFAULTS: Record<string, string> = {
  NODE_ENV: 'development',
  AWS_REGION: 'ap-south-1',
  JWT_EXPIRES_IN: '7d',
  OTP_EXPIRY_SECONDS: '300',
  OTP_MAX_ATTEMPTS: '5',
  RATE_LIMIT_OTP_SEND: '3',
  RATE_LIMIT_OTP_WINDOW: '900',
};

export function validateEnv(): void {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Set defaults for optional variables
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_ENV_VARS_WITH_DEFAULTS)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
    }
  }
}

export function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}
