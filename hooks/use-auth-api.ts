import { useState } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

// Development mode flag for logging
const DEV_MODE = __DEV__;

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
    isVerified?: boolean;
    role: 'worker' | 'user'; // Only workers can login; 'user' means not registered
  };
}

export function useAuthApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async (mobile: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Always call the actual API to send OTP
      const response = await api.post<SendOtpResponse>(API_ENDPOINTS.SEND_OTP, { mobile });

      if (!response.success) {
        setError(response.error?.message || 'Failed to send OTP');
        return null;
      }

      // In dev mode, the API returns testOtp which can be used for testing
      if (DEV_MODE && response.data?.testOtp) {
        console.log(`[DEV] OTP for ${mobile}: ${response.data.testOtp}`);
      }

      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP. Please check your connection.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (mobile: string, otp: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the actual API to verify OTP and get worker status
      const response = await api.post<VerifyOtpResponse>(API_ENDPOINTS.VERIFY_OTP, {
        mobile,
        otp,
      });

      if (response.success && response.data) {
        if (DEV_MODE) {
          console.log(`[DEV] Login successful - role: ${response.data.user.role}, workerId: ${response.data.user.workerId}`);
        }
        return response.data;
      }

      setError(response.error?.message || 'Invalid OTP');
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify OTP. Please check your connection.';
      setError(message);
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
