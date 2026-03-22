import { useState } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

interface SendOtpResponse {
  message: string;
  mobile: string;
  testOtp?: string; // Only in dev mode
}

interface VerifyOtpResponse {
  message: string;
  token: string;
  user: {
    mobile: string;
    workerId?: string;
    isNewUser: boolean;
  };
}

export function useAuthApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async (mobile: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<SendOtpResponse>(API_ENDPOINTS.SEND_OTP, { mobile });

      if (!response.success) {
        setError(response.error?.message || 'Failed to send OTP');
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

  const verifyOtp = async (mobile: string, otp: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<VerifyOtpResponse>(API_ENDPOINTS.VERIFY_OTP, {
        mobile,
        otp,
      });

      if (!response.success) {
        setError(response.error?.message || 'Invalid OTP');
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
    sendOtp,
    verifyOtp,
    isLoading,
    error,
    clearError,
  };
}
