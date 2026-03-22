import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { Worker } from '@/shared/types';

// Enable mock data for testing (set to false to use real API)
const USE_MOCK_DATA = true;

// Mock worker data for testing UI
const MOCK_WORKERS: Worker[] = [
  {
    workerId: 'mock-1',
    name: 'Rajesh Kumar',
    mobile: '9876543210',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'mock-town',
    townName: 'Sadar Bazaar',
    tehsilName: 'Sadar',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    experienceYears: 8,
    isAvailable: true,
    isApproved: true,
    isRejected: false,
    aadhaarHash: 'mock-hash',
    aadhaarLast4: '1234',
    viewCount: 150,
    avgRating: 4.5,
    reviewCount: 32,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'mock-2',
    name: 'Suresh Sharma',
    mobile: '9876543211',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'mock-town',
    townName: 'Hazratganj',
    tehsilName: 'Sadar',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    experienceYears: 12,
    isAvailable: true,
    isApproved: true,
    isRejected: false,
    aadhaarHash: 'mock-hash',
    aadhaarLast4: '5678',
    viewCount: 230,
    avgRating: 4.8,
    reviewCount: 56,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'mock-3',
    name: 'Amit Verma',
    mobile: '9876543212',
    categoryId: 'painter',
    categoryName: 'Painter',
    townId: 'mock-town',
    townName: 'Gomti Nagar',
    tehsilName: 'Sadar',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    experienceYears: 5,
    isAvailable: false,
    isApproved: true,
    isRejected: false,
    aadhaarHash: 'mock-hash',
    aadhaarLast4: '9012',
    viewCount: 89,
    avgRating: 4.2,
    reviewCount: 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'mock-4',
    name: 'Vikram Singh',
    mobile: '9876543213',
    categoryId: 'raj-mistry',
    categoryName: 'Raj Mistry',
    townId: 'mock-town',
    townName: 'Aliganj',
    tehsilName: 'Sadar',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    experienceYears: 15,
    isAvailable: true,
    isApproved: true,
    isRejected: false,
    aadhaarHash: 'mock-hash',
    aadhaarLast4: '3456',
    viewCount: 312,
    avgRating: 4.9,
    reviewCount: 78,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'mock-5',
    name: 'Deepak Yadav',
    mobile: '9876543214',
    categoryId: 'carpenter',
    categoryName: 'Carpenter',
    townId: 'mock-town',
    townName: 'Indira Nagar',
    tehsilName: 'Sadar',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    experienceYears: 10,
    isAvailable: true,
    isApproved: true,
    isRejected: false,
    aadhaarHash: 'mock-hash',
    aadhaarLast4: '7890',
    viewCount: 178,
    avgRating: 4.6,
    reviewCount: 41,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'mock-6',
    name: 'Ramesh Gupta',
    mobile: '9876543215',
    categoryId: 'welder',
    categoryName: 'Welder',
    townId: 'mock-town',
    townName: 'Chowk',
    tehsilName: 'Sadar',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    experienceYears: 7,
    isAvailable: true,
    isApproved: true,
    isRejected: false,
    aadhaarHash: 'mock-hash',
    aadhaarLast4: '2345',
    viewCount: 95,
    avgRating: 4.3,
    reviewCount: 22,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'mock-7',
    name: 'Anil Mishra',
    mobile: '9876543216',
    categoryId: 'ac-repair',
    categoryName: 'AC Repair',
    townId: 'mock-town',
    townName: 'Mahanagar',
    tehsilName: 'Sadar',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    experienceYears: 6,
    isAvailable: true,
    isApproved: true,
    isRejected: false,
    aadhaarHash: 'mock-hash',
    aadhaarLast4: '6789',
    viewCount: 203,
    avgRating: 4.7,
    reviewCount: 48,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'mock-8',
    name: 'Sanjay Tiwari',
    mobile: '9876543217',
    categoryId: 'bike-service',
    categoryName: 'Bike Service',
    townId: 'mock-town',
    townName: 'Aminabad',
    tehsilName: 'Sadar',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    experienceYears: 4,
    isAvailable: false,
    isApproved: true,
    isRejected: false,
    aadhaarHash: 'mock-hash',
    aadhaarLast4: '0123',
    viewCount: 67,
    avgRating: 4.1,
    reviewCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// All available category IDs for multi-category queries
const ALL_CATEGORY_IDS = [
  'plumber',
  'electrician',
  'painter',
  'raj-mistry',
  'carpenter',
  'welder',
  'ac-repair',
  'washing-machine',
  'cycle-repair',
  'bike-service',
];

interface UseWorkersParams {
  categoryId?: string;
  townId?: string;
  limit?: number;
}

interface WorkersResponse {
  workers: Worker[];
  nextCursor?: string;
}

export function useWorkers(params: UseWorkersParams = {}) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Use ref for cursor to avoid dependency issues
  const cursorRef = useRef<string | null>(null);

  const fetchWorkers = useCallback(async (reset = false) => {
    if (!params.categoryId) {
      setWorkers([]);
      return;
    }

    if (reset) {
      setIsLoading(true);
      cursorRef.current = null;
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params.townId) queryParams.append('townId', params.townId);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (!reset && cursorRef.current) queryParams.append('cursor', cursorRef.current);

      const endpoint = `${API_ENDPOINTS.WORKERS}?${queryParams.toString()}`;
      const response = await api.get<WorkersResponse>(endpoint);

      if (response.success && response.data) {
        if (reset) {
          setWorkers(response.data.workers);
        } else {
          setWorkers((prev) => [...prev, ...response.data!.workers]);
        }
        cursorRef.current = response.data.nextCursor || null;
        setHasMore(!!response.data.nextCursor);
      } else {
        setError(response.error?.message || 'Failed to load workers');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [params.categoryId, params.townId, params.limit]);

  useEffect(() => {
    fetchWorkers(true);
  }, [fetchWorkers]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && cursorRef.current) {
      fetchWorkers(false);
    }
  }, [isLoadingMore, hasMore, fetchWorkers]);

  const refresh = useCallback(() => {
    fetchWorkers(true);
  }, [fetchWorkers]);

  return {
    workers,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

/**
 * Hook to fetch workers from multiple categories in parallel.
 * Used when "All" category filter is selected.
 * Since backend requires both townId + categoryId, we make parallel API calls.
 */
interface UseWorkersMultiCategoryParams {
  townId?: string;
  categoryIds?: string[];
  enabled?: boolean;
}

export function useWorkersMultiCategory(params: UseWorkersMultiCategoryParams = {}) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { townId, categoryIds = ALL_CATEGORY_IDS, enabled = true } = params;

  const fetchAllWorkers = useCallback(async () => {
    if (!townId || !enabled) {
      setWorkers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Make parallel API calls for each category
      const promises = categoryIds.map(async (categoryId) => {
        const queryParams = new URLSearchParams();
        queryParams.append('categoryId', categoryId);
        queryParams.append('townId', townId);
        queryParams.append('limit', '10'); // Limit per category

        const endpoint = `${API_ENDPOINTS.WORKERS}?${queryParams.toString()}`;
        const response = await api.get<WorkersResponse>(endpoint);

        if (response.success && response.data) {
          return response.data.workers;
        }
        return [];
      });

      const results = await Promise.all(promises);

      // Flatten and merge all workers
      const allWorkers = results.flat();

      // Sort by rating (highest first), then by review count
      allWorkers.sort((a, b) => {
        if (b.avgRating !== a.avgRating) {
          return b.avgRating - a.avgRating;
        }
        return b.reviewCount - a.reviewCount;
      });

      setWorkers(allWorkers);
    } catch (err) {
      console.error('Multi-category fetch error:', err);
      setError('Failed to load workers');
    } finally {
      setIsLoading(false);
    }
  }, [townId, categoryIds, enabled]);

  useEffect(() => {
    fetchAllWorkers();
  }, [fetchAllWorkers]);

  const refresh = useCallback(() => {
    fetchAllWorkers();
  }, [fetchAllWorkers]);

  return {
    workers,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Combined hook that handles both single category and multi-category queries.
 * When categoryId is 'all' or undefined, fetches from all categories.
 */
interface UseNearbyWorkersParams {
  townId?: string;
  categoryId?: string; // 'all' or specific category
}

export function useNearbyWorkers(params: UseNearbyWorkersParams) {
  const { townId, categoryId } = params;
  const isAllCategories = !categoryId || categoryId === 'all';

  // Mock data state
  const [mockWorkers, setMockWorkers] = useState<Worker[]>([]);
  const [mockLoading, setMockLoading] = useState(true);

  // Filter mock data based on category
  useEffect(() => {
    if (USE_MOCK_DATA) {
      setMockLoading(true);
      // Simulate network delay
      const timer = setTimeout(() => {
        if (isAllCategories) {
          setMockWorkers(MOCK_WORKERS);
        } else {
          setMockWorkers(MOCK_WORKERS.filter(w => w.categoryId === categoryId));
        }
        setMockLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [categoryId, isAllCategories]);

  // Single category hook
  const singleCategory = useWorkers({
    categoryId: isAllCategories ? undefined : categoryId,
    townId,
  });

  // Multi-category hook
  const multiCategory = useWorkersMultiCategory({
    townId,
    enabled: isAllCategories && !!townId && !USE_MOCK_DATA,
  });

  // Return mock data if enabled
  if (USE_MOCK_DATA) {
    return {
      workers: mockWorkers,
      isLoading: mockLoading,
      error: null,
      refresh: () => {
        setMockLoading(true);
        setTimeout(() => setMockLoading(false), 500);
      },
      hasMore: false,
      loadMore: () => {},
      isLoadingMore: false,
    };
  }

  // Return appropriate results based on selection
  if (isAllCategories) {
    return {
      workers: multiCategory.workers,
      isLoading: multiCategory.isLoading,
      error: multiCategory.error,
      refresh: multiCategory.refresh,
      hasMore: false, // Multi-category doesn't support pagination yet
      loadMore: () => {},
      isLoadingMore: false,
    };
  }

  return singleCategory;
}

export function useWorkerDetail(workerId: string | null) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorker = useCallback(async () => {
    if (!workerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ worker: Worker }>(API_ENDPOINTS.WORKER_BY_ID(workerId));

      if (response.success && response.data) {
        setWorker(response.data.worker);
      } else {
        setError(response.error?.message || 'Worker not found');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  return {
    worker,
    isLoading,
    error,
    refetch: fetchWorker,
  };
}
