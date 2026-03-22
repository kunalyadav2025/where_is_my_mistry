import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { Category } from '@/shared/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ categories: Category[] }>(API_ENDPOINTS.CATEGORIES);

      if (response.success && response.data) {
        setCategories(response.data.categories);
      } else {
        setError(response.error?.message || 'Failed to load categories');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}
