const getApiBaseUrl = (): string => {
  // Configuration for API endpoint
  //
  // Options:
  // 1. USE_LOCAL_BACKEND = true  → Use local backend (requires `npm run dev` in backend folder)
  // 2. USE_LOCAL_BACKEND = false → Use AWS production API (recommended)
  //
  // Your workers are stored in AWS DynamoDB, so use the production API.

  const USE_LOCAL_BACKEND = false; // Set to true only if running local backend

  if (USE_LOCAL_BACKEND) {
    // Local backend configuration
    // Android emulator: 10.0.2.2, iOS simulator: localhost, Physical device: your computer's IP
    const LOCAL_IP = '10.0.2.2';
    const LOCAL_PORT = '3001';
    return `http://${LOCAL_IP}:${LOCAL_PORT}/api`;
  }

  // AWS Production API URL
  return 'https://oaa2rqfw3i.execute-api.ap-south-1.amazonaws.com/dev/api';
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
