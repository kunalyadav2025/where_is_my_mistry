import { renderHook, waitFor } from '@testing-library/react-native';
import { useCategories } from '../use-categories';
import { api } from '@/services/api';
import { mockCategories, mockApiResponse } from '@/__tests__/utils/mocks';

jest.mock('@/services/api');

describe('useCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch categories on mount', async () => {
    const mockResponse = mockApiResponse.success({ categories: mockCategories });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCategories());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.categories).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith('/categories');
    expect(result.current.categories).toEqual(mockCategories);
    expect(result.current.error).toBe(null);
  });

  it('should handle empty categories list', async () => {
    const mockResponse = mockApiResponse.success({ categories: [] });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should handle API error', async () => {
    const mockResponse = mockApiResponse.error('Failed to fetch categories', 'INTERNAL_ERROR');

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch categories');
  });

  it('should handle network error', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network failed'));

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.error).toBe('Network error. Please try again.');
  });

  it('should refetch categories when refetch is called', async () => {
    const mockResponse = mockApiResponse.success({ categories: mockCategories });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledTimes(1);

    // Call refetch
    result.current.refetch();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle categories with all fields', async () => {
    const detailedCategories = [
      {
        categoryId: 'plumber',
        name: 'Plumber',
        nameHindi: 'नलसाज़',
        icon: 'wrench.fill',
        order: 1,
        isActive: true,
        workerCount: 25,
      },
    ];

    const mockResponse = mockApiResponse.success({ categories: detailedCategories });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories[0]).toMatchObject({
      categoryId: 'plumber',
      name: 'Plumber',
      nameHindi: 'नलसाज़',
      icon: 'wrench.fill',
      order: 1,
      isActive: true,
      workerCount: 25,
    });
  });
});
