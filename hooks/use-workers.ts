import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { Worker } from '@/shared/types';

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
