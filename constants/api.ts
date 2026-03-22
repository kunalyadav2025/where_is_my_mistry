const getApiBaseUrl = (): string => {
  // Always use production API URL
  // The backend is deployed to AWS and works for both development and production
  // Note: localhost doesn't work on physical devices (it refers to the phone itself)
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
