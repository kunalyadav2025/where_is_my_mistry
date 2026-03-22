import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { Worker } from '@/shared/types';

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

  // Single category hook
  const singleCategory = useWorkers({
    categoryId: isAllCategories ? undefined : categoryId,
    townId,
  });

  // Multi-category hook
  const multiCategory = useWorkersMultiCategory({
    townId,
    enabled: isAllCategories && !!townId,
  });

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
