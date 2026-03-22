import { useState } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { Worker } from '@/shared/types';

export interface WorkerRegistrationData {
  name: string;
  mobile: string;
  categoryId: string;
  categoryName: string;
  townId: string;
  townName: string;
  tehsilId: string;
  tehsilName: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  pinCode: string;
  experienceYears: number;
  bio?: string;
  aadhaarNumber: string;
}

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
      const response = await api.post<RegisterWorkerResponse>(API_ENDPOINTS.WORKERS, data as unknown as Record<string, unknown>);

      if (!response.success) {
        const errorMessage = response.error?.message || 'Registration failed';
        setError(errorMessage);
        return null;
      }

      return response.data;
    } catch (err) {
      setError('Network error. Please try again.');
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
