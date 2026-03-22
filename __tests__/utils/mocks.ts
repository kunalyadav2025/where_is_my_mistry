import type { Category, Worker } from '@/shared/types';

export const mockCategories: Category[] = [
  {
    categoryId: 'plumber',
    name: 'Plumber',
    nameHindi: 'नलसाज़',
    icon: 'wrench.fill',
    order: 1,
    isActive: true,
    workerCount: 25,
  },
  {
    categoryId: 'electrician',
    name: 'Electrician',
    nameHindi: 'बिजली मिस्त्री',
    icon: 'bolt.fill',
    order: 2,
    isActive: true,
    workerCount: 18,
  },
  {
    categoryId: 'carpenter',
    name: 'Carpenter',
    nameHindi: 'बढ़ई',
    icon: 'hammer.fill',
    order: 3,
    isActive: true,
    workerCount: 12,
  },
];

export const mockWorker: Worker = {
  workerId: 'worker-123',
  name: 'Rajesh Kumar',
  mobile: '9876543210',
  profilePhotoUrl: 'https://example.com/photo.jpg',
  bio: 'Experienced plumber with 10+ years',
  categoryId: 'plumber',
  categoryName: 'Plumber',
  townId: 'town-1',
  townName: 'Indore City',
  tehsilName: 'Indore',
  districtName: 'Indore',
  stateName: 'Madhya Pradesh',
  pinCode: '452001',
  experienceYears: 10,
  isAvailable: true,
  isApproved: true,
  isRejected: false,
  aadhaarHash: '$2b$10$hashedvalue',
  aadhaarLast4: '1234',
  viewCount: 150,
  avgRating: 4.5,
  reviewCount: 25,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-03-20T14:20:00Z',
};

export const mockWorkers: Worker[] = [
  mockWorker,
  {
    ...mockWorker,
    workerId: 'worker-456',
    name: 'Amit Sharma',
    mobile: '9876543211',
    experienceYears: 7,
    avgRating: 4.2,
    reviewCount: 18,
    isAvailable: false,
  },
  {
    ...mockWorker,
    workerId: 'worker-789',
    name: 'Suresh Patel',
    mobile: '9876543212',
    experienceYears: 15,
    avgRating: 4.8,
    reviewCount: 45,
  },
];

export const mockStates = [
  { id: 'mp', stateId: 'mp', name: 'Madhya Pradesh', nameHindi: 'मध्य प्रदेश' },
  { id: 'mh', stateId: 'mh', name: 'Maharashtra', nameHindi: 'महाराष्ट्र' },
  { id: 'rj', stateId: 'rj', name: 'Rajasthan', nameHindi: 'राजस्थान' },
];

export const mockDistricts = [
  { id: 'indore', districtId: 'indore', stateId: 'mp', name: 'Indore', nameHindi: 'इंदौर' },
  { id: 'bhopal', districtId: 'bhopal', stateId: 'mp', name: 'Bhopal', nameHindi: 'भोपाल' },
];

export const mockTehsils = [
  { id: 'indore-city', tehsilId: 'indore-city', districtId: 'indore', name: 'Indore City', nameHindi: 'इंदौर शहर' },
  { id: 'mhow', tehsilId: 'mhow', districtId: 'indore', name: 'Mhow', nameHindi: 'महू' },
];

export const mockTowns = [
  { id: 'vijay-nagar', townId: 'vijay-nagar', tehsilId: 'indore-city', name: 'Vijay Nagar', nameHindi: 'विजय नगर' },
  { id: 'palasia', townId: 'palasia', tehsilId: 'indore-city', name: 'Palasia', nameHindi: 'पलासिया' },
];

export const mockApiResponse = {
  success: <T>(data: T) => ({
    success: true,
    data,
  }),
  error: (message: string, code = 'UNKNOWN_ERROR') => ({
    success: false,
    error: {
      code,
      message,
    },
  }),
};
