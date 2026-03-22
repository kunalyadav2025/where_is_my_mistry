import { useState, useCallback } from 'react';
import type { Category } from '@/shared/types';

// Static categories - these don't change frequently, so no need for API call
const STATIC_CATEGORIES: Category[] = [
  { categoryId: 'plumber', name: 'Plumber', nameHindi: 'प्लंबर' },
  { categoryId: 'electrician', name: 'Electrician', nameHindi: 'इलेक्ट्रीशियन' },
  { categoryId: 'painter', name: 'Painter', nameHindi: 'पेंटर' },
  { categoryId: 'carpenter', name: 'Carpenter', nameHindi: 'बढ़ई' },
  { categoryId: 'welder', name: 'Welder', nameHindi: 'वेल्डर' },
  { categoryId: 'ac-repair', name: 'AC Repair', nameHindi: 'AC मरम्मत' },
];

export function useCategories() {
  const [categories] = useState<Category[]>(STATIC_CATEGORIES);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const refetch = useCallback(() => {
    // Categories are static, no need to refetch
  }, []);

  return {
    categories,
    isLoading,
    error,
    refetch,
  };
}
