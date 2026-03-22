import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuthApi } from '../use-auth-api';
import { api } from '@/services/api';
import { mockApiResponse } from '@/__tests__/utils/mocks';

jest.mock('@/services/api');

describe('useAuthApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('should send OTP successfully and return response', async () => {
      const mockResponse = mockApiResponse.success({
        message: 'OTP sent successfully',
        mobile: '9876543210',
        testOtp: '123456',
      });

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthApi());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);

      let otpResult;
      await act(async () => {
        otpResult = await result.current.sendOtp('9876543210');
      });

      expect(api.post).toHaveBeenCalledWith('/auth/send-otp', { mobile: '9876543210' });
      expect(otpResult).toEqual(mockResponse.data);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle API error response', async () => {
      const mockResponse = mockApiResponse.error('Mobile number is required', 'VALIDATION_ERROR');

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthApi());

      let otpResult;
      await act(async () => {
        otpResult = await result.current.sendOtp('');
      });

      expect(otpResult).toBe(null);
      expect(result.current.error).toBe('Mobile number is required');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle network error', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Network failed'));

      const { result } = renderHook(() => useAuthApi());

      let otpResult;
      await act(async () => {
        otpResult = await result.current.sendOtp('9876543210');
      });

      expect(otpResult).toBe(null);
      expect(result.current.error).toBe('Network error. Please try again.');
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during API call', async () => {
      const mockResponse = mockApiResponse.success({
        message: 'OTP sent successfully',
        mobile: '9876543210',
      });

      (api.post as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockResponse), 100);
          })
      );

      const { result } = renderHook(() => useAuthApi());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.sendOtp('9876543210');
      });

      // Should be loading immediately after call
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Should not be loading after completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully and return user data', async () => {
      const mockResponse = mockApiResponse.success({
        message: 'OTP verified successfully',
        token: 'jwt-token-123',
        user: {
          mobile: '9876543210',
          workerId: 'worker-123',
          isNewUser: false,
        },
      });

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthApi());

      let verifyResult;
      await act(async () => {
        verifyResult = await result.current.verifyOtp('9876543210', '123456');
      });

      expect(api.post).toHaveBeenCalledWith('/auth/verify-otp', {
        mobile: '9876543210',
        otp: '123456',
      });
      expect(verifyResult).toEqual(mockResponse.data);
      expect(result.current.error).toBe(null);
    });

    it('should handle invalid OTP error', async () => {
      const mockResponse = mockApiResponse.error('Invalid OTP', 'INVALID_OTP');

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthApi());

      let verifyResult;
      await act(async () => {
        verifyResult = await result.current.verifyOtp('9876543210', '000000');
      });

      expect(verifyResult).toBe(null);
      expect(result.current.error).toBe('Invalid OTP');
    });

    it('should handle expired OTP error', async () => {
      const mockResponse = mockApiResponse.error('OTP expired', 'OTP_EXPIRED');

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthApi());

      let verifyResult;
      await act(async () => {
        verifyResult = await result.current.verifyOtp('9876543210', '123456');
      });

      expect(verifyResult).toBe(null);
      expect(result.current.error).toBe('OTP expired');
    });

    it('should return new user status correctly', async () => {
      const mockResponse = mockApiResponse.success({
        message: 'OTP verified successfully',
        token: 'jwt-token-456',
        user: {
          mobile: '9876543210',
          isNewUser: true,
        },
      });

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthApi());

      let verifyResult;
      await act(async () => {
        verifyResult = await result.current.verifyOtp('9876543210', '123456');
      });

      expect(verifyResult?.user.isNewUser).toBe(true);
      expect(verifyResult?.user.workerId).toBeUndefined();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const mockResponse = mockApiResponse.error('Some error', 'ERROR');

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthApi());

      await act(async () => {
        await result.current.sendOtp('9876543210');
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});
