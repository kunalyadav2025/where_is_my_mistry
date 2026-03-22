import { renderHook, act } from '@testing-library/react-native';
import { useWorkerRegistration, WorkerRegistrationData } from '../use-worker-registration';
import { api } from '@/services/api';
import { mockWorker, mockApiResponse } from '@/__tests__/utils/mocks';

jest.mock('@/services/api');

describe('useWorkerRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validRegistrationData: WorkerRegistrationData = {
    name: 'Rajesh Kumar',
    mobile: '9876543210',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'town-1',
    townName: 'Indore City',
    tehsilId: 'tehsil-1',
    tehsilName: 'Indore',
    districtId: 'district-1',
    districtName: 'Indore',
    stateId: 'state-1',
    stateName: 'Madhya Pradesh',
    experienceYears: 10,
    bio: 'Experienced plumber',
    aadhaarNumber: '123456789012',
  };

  describe('registerWorker', () => {
    it('should register worker successfully', async () => {
      const mockResponse = mockApiResponse.success({
        message: 'Worker registered successfully',
        worker: mockWorker,
      });

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);

      let registerResult;
      await act(async () => {
        registerResult = await result.current.registerWorker(validRegistrationData);
      });

      expect(api.post).toHaveBeenCalledWith('/workers', validRegistrationData);
      expect(registerResult).toEqual(mockResponse.data);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle validation error for missing name', async () => {
      const mockResponse = mockApiResponse.error(
        'Name is required',
        'VALIDATION_ERROR'
      );

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      const invalidData = { ...validRegistrationData, name: '' };

      let registerResult;
      await act(async () => {
        registerResult = await result.current.registerWorker(invalidData);
      });

      expect(registerResult).toBe(null);
      expect(result.current.error).toBe('Name is required');
    });

    it('should handle validation error for invalid mobile number', async () => {
      const mockResponse = mockApiResponse.error(
        'Mobile number must be 10 digits',
        'VALIDATION_ERROR'
      );

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      const invalidData = { ...validRegistrationData, mobile: '123' };

      let registerResult;
      await act(async () => {
        registerResult = await result.current.registerWorker(invalidData);
      });

      expect(registerResult).toBe(null);
      expect(result.current.error).toBe('Mobile number must be 10 digits');
    });

    it('should handle validation error for invalid Aadhaar number', async () => {
      const mockResponse = mockApiResponse.error(
        'Aadhaar number must be 12 digits',
        'VALIDATION_ERROR'
      );

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      const invalidData = { ...validRegistrationData, aadhaarNumber: '123' };

      let registerResult;
      await act(async () => {
        registerResult = await result.current.registerWorker(invalidData);
      });

      expect(registerResult).toBe(null);
      expect(result.current.error).toBe('Aadhaar number must be 12 digits');
    });

    it('should handle duplicate worker error', async () => {
      const mockResponse = mockApiResponse.error(
        'Worker with this mobile number already exists',
        'DUPLICATE_ENTRY'
      );

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      let registerResult;
      await act(async () => {
        registerResult = await result.current.registerWorker(validRegistrationData);
      });

      expect(registerResult).toBe(null);
      expect(result.current.error).toBe('Worker with this mobile number already exists');
    });

    it('should handle network error', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Network failed'));

      const { result } = renderHook(() => useWorkerRegistration());

      let registerResult;
      await act(async () => {
        registerResult = await result.current.registerWorker(validRegistrationData);
      });

      expect(registerResult).toBe(null);
      expect(result.current.error).toBe('Network error. Please try again.');
    });

    it('should handle experience years validation', async () => {
      const mockResponse = mockApiResponse.error(
        'Experience years must be between 0 and 50',
        'VALIDATION_ERROR'
      );

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      const invalidData = { ...validRegistrationData, experienceYears: -1 };

      let registerResult;
      await act(async () => {
        registerResult = await result.current.registerWorker(invalidData);
      });

      expect(registerResult).toBe(null);
      expect(result.current.error).toBe('Experience years must be between 0 and 50');
    });

    it('should handle bio length validation', async () => {
      const mockResponse = mockApiResponse.error(
        'Bio must be less than 500 characters',
        'VALIDATION_ERROR'
      );

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      const longBio = 'a'.repeat(501);
      const invalidData = { ...validRegistrationData, bio: longBio };

      let registerResult;
      await act(async () => {
        registerResult = await result.current.registerWorker(invalidData);
      });

      expect(registerResult).toBe(null);
      expect(result.current.error).toBe('Bio must be less than 500 characters');
    });

    it('should register worker without optional bio', async () => {
      const mockResponse = mockApiResponse.success({
        message: 'Worker registered successfully',
        worker: { ...mockWorker, bio: undefined },
      });

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      const dataWithoutBio = { ...validRegistrationData, bio: undefined };

      let registerResult;
      await act(async () => {
        registerResult = await result.current.registerWorker(dataWithoutBio);
      });

      expect(registerResult).toBeTruthy();
      expect(result.current.error).toBe(null);
    });

    it('should set loading state during registration', async () => {
      const mockResponse = mockApiResponse.success({
        message: 'Worker registered successfully',
        worker: mockWorker,
      });

      (api.post as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockResponse), 100);
          })
      );

      const { result } = renderHook(() => useWorkerRegistration());

      expect(result.current.isLoading).toBe(false);

      const registerPromise = act(async () => {
        await result.current.registerWorker(validRegistrationData);
      });

      // Check loading state is true during registration
      expect(result.current.isLoading).toBe(true);

      await registerPromise;

      // Check loading state is false after registration
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const mockResponse = mockApiResponse.error('Some error', 'ERROR');

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      await act(async () => {
        await result.current.registerWorker(validRegistrationData);
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle generic registration failure', async () => {
      const mockResponse = mockApiResponse.error('', '');

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      let registerResult;
      await act(async () => {
        registerResult = await result.current.registerWorker(validRegistrationData);
      });

      expect(registerResult).toBe(null);
      expect(result.current.error).toBe('Registration failed');
    });

    it('should handle all required location fields', async () => {
      const mockResponse = mockApiResponse.success({
        message: 'Worker registered successfully',
        worker: mockWorker,
      });

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkerRegistration());

      await act(async () => {
        await result.current.registerWorker(validRegistrationData);
      });

      expect(api.post).toHaveBeenCalledWith(
        '/workers',
        expect.objectContaining({
          townId: 'town-1',
          townName: 'Indore City',
          tehsilId: 'tehsil-1',
          tehsilName: 'Indore',
          districtId: 'district-1',
          districtName: 'Indore',
          stateId: 'state-1',
          stateName: 'Madhya Pradesh',
        })
      );
    });
  });
});
