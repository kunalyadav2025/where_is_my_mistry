import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLocations } from '../use-locations';
import { api } from '@/services/api';
import { mockStates, mockDistricts, mockTehsils, mockTowns, mockApiResponse } from '@/__tests__/utils/mocks';

jest.mock('@/services/api');

describe('useLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchStates', () => {
    it('should fetch states successfully', async () => {
      const mockResponse = mockApiResponse.success({ states: mockStates });

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      expect(result.current.states).toEqual([]);

      await act(async () => {
        await result.current.fetchStates();
      });

      expect(api.get).toHaveBeenCalledWith('/locations/states');
      expect(result.current.states).toEqual(mockStates);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle API error when fetching states', async () => {
      const mockResponse = mockApiResponse.error('Failed to load states', 'INTERNAL_ERROR');

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      await act(async () => {
        await result.current.fetchStates();
      });

      expect(result.current.states).toEqual([]);
      expect(result.current.error).toBe('Failed to load states');
    });

    it('should handle network error when fetching states', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network failed'));

      const { result } = renderHook(() => useLocations());

      await act(async () => {
        await result.current.fetchStates();
      });

      expect(result.current.error).toBe('Network error. Please try again.');
    });
  });

  describe('fetchDistricts', () => {
    it('should fetch districts for a state', async () => {
      const mockResponse = mockApiResponse.success({ districts: mockDistricts });

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      await act(async () => {
        await result.current.fetchDistricts('mp');
      });

      expect(api.get).toHaveBeenCalledWith('/locations/states/mp/districts');
      expect(result.current.districts).toEqual(mockDistricts);
      expect(result.current.error).toBe(null);
    });

    it('should clear tehsils and towns when fetching districts', async () => {
      const mockResponse = mockApiResponse.success({ districts: mockDistricts });

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      // Set some initial data
      await act(async () => {
        await result.current.fetchDistricts('mp');
        await result.current.fetchTehsils('indore');
        await result.current.fetchTowns('indore-city');
      });

      expect(result.current.tehsils.length).toBeGreaterThan(0);
      expect(result.current.towns.length).toBeGreaterThan(0);

      // Fetch new districts
      await act(async () => {
        await result.current.fetchDistricts('mh');
      });

      expect(result.current.tehsils).toEqual([]);
      expect(result.current.towns).toEqual([]);
    });

    it('should handle API error when fetching districts', async () => {
      const mockResponse = mockApiResponse.error('Failed to load districts', 'INTERNAL_ERROR');

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      await act(async () => {
        await result.current.fetchDistricts('mp');
      });

      expect(result.current.districts).toEqual([]);
      expect(result.current.error).toBe('Failed to load districts');
    });
  });

  describe('fetchTehsils', () => {
    it('should fetch tehsils for a district', async () => {
      const mockResponse = mockApiResponse.success({ tehsils: mockTehsils });

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      await act(async () => {
        await result.current.fetchTehsils('indore');
      });

      expect(api.get).toHaveBeenCalledWith('/locations/districts/indore/tehsils');
      expect(result.current.tehsils).toEqual(mockTehsils);
      expect(result.current.error).toBe(null);
    });

    it('should clear towns when fetching tehsils', async () => {
      const mockResponse = mockApiResponse.success({ tehsils: mockTehsils });

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      // Set some initial towns
      await act(async () => {
        await result.current.fetchTehsils('indore');
        await result.current.fetchTowns('indore-city');
      });

      expect(result.current.towns.length).toBeGreaterThan(0);

      // Fetch new tehsils
      await act(async () => {
        await result.current.fetchTehsils('bhopal');
      });

      expect(result.current.towns).toEqual([]);
    });

    it('should handle API error when fetching tehsils', async () => {
      const mockResponse = mockApiResponse.error('Failed to load tehsils', 'INTERNAL_ERROR');

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      await act(async () => {
        await result.current.fetchTehsils('indore');
      });

      expect(result.current.tehsils).toEqual([]);
      expect(result.current.error).toBe('Failed to load tehsils');
    });
  });

  describe('fetchTowns', () => {
    it('should fetch towns for a tehsil', async () => {
      const mockResponse = mockApiResponse.success({ towns: mockTowns });

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      await act(async () => {
        await result.current.fetchTowns('indore-city');
      });

      expect(api.get).toHaveBeenCalledWith('/locations/tehsils/indore-city/towns');
      expect(result.current.towns).toEqual(mockTowns);
      expect(result.current.error).toBe(null);
    });

    it('should handle API error when fetching towns', async () => {
      const mockResponse = mockApiResponse.error('Failed to load towns', 'INTERNAL_ERROR');

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      await act(async () => {
        await result.current.fetchTowns('indore-city');
      });

      expect(result.current.towns).toEqual([]);
      expect(result.current.error).toBe('Failed to load towns');
    });

    it('should handle network error when fetching towns', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network failed'));

      const { result } = renderHook(() => useLocations());

      await act(async () => {
        await result.current.fetchTowns('indore-city');
      });

      expect(result.current.error).toBe('Network error. Please try again.');
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const mockResponse = mockApiResponse.error('Some error', 'ERROR');

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocations());

      await act(async () => {
        await result.current.fetchStates();
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('loading state', () => {
    it('should set loading state during API call', async () => {
      const mockResponse = mockApiResponse.success({ states: mockStates });

      (api.get as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockResponse), 100);
          })
      );

      const { result } = renderHook(() => useLocations());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.fetchStates();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('hierarchical data cascade', () => {
    it('should maintain hierarchy when fetching locations step by step', async () => {
      (api.get as jest.Mock)
        .mockResolvedValueOnce(mockApiResponse.success({ states: mockStates }))
        .mockResolvedValueOnce(mockApiResponse.success({ districts: mockDistricts }))
        .mockResolvedValueOnce(mockApiResponse.success({ tehsils: mockTehsils }))
        .mockResolvedValueOnce(mockApiResponse.success({ towns: mockTowns }));

      const { result } = renderHook(() => useLocations());

      // Fetch states
      await act(async () => {
        await result.current.fetchStates();
      });
      expect(result.current.states).toEqual(mockStates);

      // Fetch districts
      await act(async () => {
        await result.current.fetchDistricts('mp');
      });
      expect(result.current.districts).toEqual(mockDistricts);
      expect(result.current.tehsils).toEqual([]);
      expect(result.current.towns).toEqual([]);

      // Fetch tehsils
      await act(async () => {
        await result.current.fetchTehsils('indore');
      });
      expect(result.current.tehsils).toEqual(mockTehsils);
      expect(result.current.towns).toEqual([]);

      // Fetch towns
      await act(async () => {
        await result.current.fetchTowns('indore-city');
      });
      expect(result.current.towns).toEqual(mockTowns);
    });
  });
});
