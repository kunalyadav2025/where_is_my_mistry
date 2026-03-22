import { useState } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { Worker, WorkerCreateInput } from '@/shared/types';

// Use shared type for registration data
export type WorkerRegistrationData = WorkerCreateInput;

interface RegisterWorkerResponse {
  message: string;
  worker: Worker;
}

export function useWorkerRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerWorker = async (data: WorkerRegistrationData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert to Record type for API call
      const payload: Record<string, unknown> = { ...data };
      const response = await api.post<RegisterWorkerResponse>(API_ENDPOINTS.WORKERS, payload);

      if (!response.success) {
        const errorMessage = response.error?.message || 'Registration failed';
        setError(errorMessage);
        return null;
      }

      // Validate response has worker data
      if (!response.data?.worker) {
        setError('Registration failed - no worker data returned');
        return null;
      }

      return response.data;
    } catch (err) {
      // Provide more specific error messages
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    registerWorker,
    isLoading,
    error,
    clearError,
  };
}
