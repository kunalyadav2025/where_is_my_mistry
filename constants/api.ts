import Constants from 'expo-constants';

const getApiBaseUrl = (): string => {
  // In development, use local serverless-offline endpoint
  if (__DEV__) {
    // For Android emulator, use 10.0.2.2 instead of localhost
    // For iOS simulator and web, use localhost
    const localhost = Constants.platform?.android ? '10.0.2.2' : 'localhost';
    return `http://${localhost}:3001/api`;
  }

  // In production, use the deployed API Gateway URL
  // This will be set via EAS build environment variables
  return Constants.expoConfig?.extra?.apiUrl || 'https://api.whereismymistry.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',

  // Auth
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',

  // Workers
  WORKERS: '/workers',
  WORKER_BY_ID: (id: string) => `/workers/${id}`,

  // Categories
  CATEGORIES: '/categories',

  // Locations
  STATES: '/locations/states',
  DISTRICTS: (stateId: string) => `/locations/states/${stateId}/districts`,
  TEHSILS: (districtId: string) => `/locations/districts/${districtId}/tehsils`,
  TOWNS: (tehsilId: string) => `/locations/tehsils/${tehsilId}/towns`,

  // Reviews
  WORKER_REVIEWS: (workerId: string) => `/workers/${workerId}/reviews`,

  // Upload
  UPLOAD_URL: '/upload/presigned-url',
} as const;
