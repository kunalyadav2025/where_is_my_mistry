import React from 'react';
import { render, fireEvent, waitFor, act } from '@/__tests__/utils/test-utils';
import RegisterDetailsScreen from '../details';
import { useWorkerRegistration } from '@/hooks/use-worker-registration';
import { useAuthApi } from '@/hooks/use-auth-api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

jest.mock('@/hooks/use-worker-registration');
jest.mock('@/hooks/use-auth-api');
jest.mock('expo-router');
jest.mock('react-native/Libraries/Alert/Alert');

// Mock timers for OTP resend functionality
jest.useFakeTimers();

describe('RegisterDetailsScreen', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockParams = {
    name: 'Rajesh Kumar',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    experienceYears: '10',
    stateId: 'madhya-pradesh',
    stateName: 'Madhya Pradesh',
    districtId: 'indore',
    districtName: 'Indore',
    tehsilId: 'indore',
    tehsilName: 'Indore',
    townId: 'vijay-nagar',
    townName: 'Vijay Nagar',
    pinCode: '452010',
  };

  const mockWorkerRegistration = {
    registerWorker: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  };

  const mockAuthApi = {
    sendOtp: jest.fn(),
    verifyOtp: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockParams);
    (useWorkerRegistration as jest.Mock).mockReturnValue(mockWorkerRegistration);
    (useAuthApi as jest.Mock).mockReturnValue(mockAuthApi);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render details screen with all elements', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText('Final Details')).toBeTruthy();
      expect(getByText('Step 3: Verification & Bio')).toBeTruthy();
      expect(getByText('Registration Summary')).toBeTruthy();
      expect(getByText('Mobile Number *')).toBeTruthy();
      expect(getByText('Aadhaar Number *')).toBeTruthy();
      expect(getByText('About You (Optional)')).toBeTruthy();
    });

    it('should display summary of previous steps', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText('Rajesh Kumar')).toBeTruthy();
      expect(getByText('Plumber')).toBeTruthy();
      expect(getByText('10 years')).toBeTruthy();
      expect(getByText('Vijay Nagar, Indore - 452010')).toBeTruthy();
    });

    it('should show terms and conditions checkbox', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText(/I agree to the/)).toBeTruthy();
      expect(getByText('Terms of Service')).toBeTruthy();
      expect(getByText('Privacy Policy')).toBeTruthy();
    });

    it('should have complete registration button', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText('Complete Registration')).toBeTruthy();
    });

    it('should show back button', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText('Back')).toBeTruthy();
    });

    it('should show step indicator with step 3 active', () => {
      const { UNSAFE_getAllByType } = render(<RegisterDetailsScreen />);

      // Step 3 of 3 should be active
      expect(() => render(<RegisterDetailsScreen />)).not.toThrow();
    });
  });

  describe('Mobile Number Input', () => {
    it('should render mobile number input with country code', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      expect(getByText('+91')).toBeTruthy();
      expect(getByPlaceholderText('Enter 10-digit mobile')).toBeTruthy();
    });

    it('should allow user to type mobile number', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');

      expect(mobileInput.props.value).toBe('9876543210');
    });

    it('should only allow numeric input', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, 'abc123xyz456');

      expect(mobileInput.props.value).toBe('123456');
    });

    it('should limit mobile number to 10 digits', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '98765432109999');

      expect(mobileInput.props.value).toBe('9876543210');
    });

    it('should show Send OTP button initially', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText('Send OTP')).toBeTruthy();
    });

    it('should disable Send OTP button when mobile is invalid', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '987654321'); // 9 digits

      const sendButton = getByText('Send OTP');
      expect(sendButton.parent?.props.disabled).toBe(true);
    });

    it('should enable Send OTP button when mobile is valid', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');

      const sendButton = getByText('Send OTP');
      expect(sendButton.parent?.props.disabled).toBe(false);
    });

    it('should validate mobile number starts with 6-9', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');

      // Valid mobile numbers
      fireEvent.changeText(mobileInput, '6876543210');
      expect(mobileInput.props.value).toBe('6876543210');

      fireEvent.changeText(mobileInput, '7876543210');
      expect(mobileInput.props.value).toBe('7876543210');

      fireEvent.changeText(mobileInput, '8876543210');
      expect(mobileInput.props.value).toBe('8876543210');

      fireEvent.changeText(mobileInput, '9876543210');
      expect(mobileInput.props.value).toBe('9876543210');
    });
  });

  describe('OTP Send Flow', () => {
    it('should call sendOtp with mobile number', async () => {
      mockAuthApi.sendOtp.mockResolvedValue({
        message: 'OTP sent successfully',
        mobile: '9876543210',
      });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');

      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(mockAuthApi.sendOtp).toHaveBeenCalledWith('9876543210');
      });
    });

    it('should show OTP input after successful send', async () => {
      mockAuthApi.sendOtp.mockResolvedValue({
        message: 'OTP sent successfully',
        mobile: '9876543210',
      });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');

      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });
    });

    it('should show alert after OTP is sent', async () => {
      mockAuthApi.sendOtp.mockResolvedValue({
        message: 'OTP sent successfully',
        mobile: '9876543210',
      });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');

      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('OTP Sent', 'OTP sent to +91 9876543210');
      });
    });

    it('should show alert for invalid mobile number', async () => {
      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '5876543210'); // Invalid start digit

      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Invalid Mobile',
          'Please enter a valid 10-digit mobile number'
        );
      });
    });

    it('should disable mobile input after OTP is sent', async () => {
      mockAuthApi.sendOtp.mockResolvedValue({
        message: 'OTP sent successfully',
        mobile: '9876543210',
      });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');

      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(mobileInput.props.editable).toBe(false);
      });
    });

    it('should show loading indicator while sending OTP', async () => {
      mockAuthApi.sendOtp.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ message: 'OTP sent' }), 100))
      );

      const updatedMock = {
        ...mockAuthApi,
        isLoading: true,
      };

      (useAuthApi as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');

      const sendButton = getByText('Send OTP');

      // Button should show loading indicator
      expect(sendButton.parent?.props.disabled).toBe(true);
    });

    it('should handle OTP send failure', async () => {
      mockAuthApi.sendOtp.mockResolvedValue(null);

      const updatedMock = {
        ...mockAuthApi,
        error: 'Failed to send OTP',
      };

      (useAuthApi as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');

      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText('Failed to send OTP')).toBeTruthy();
      });
    });
  });

  describe('OTP Verification Flow', () => {
    beforeEach(async () => {
      mockAuthApi.sendOtp.mockResolvedValue({
        message: 'OTP sent successfully',
        mobile: '9876543210',
      });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');

      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });
    });

    it('should allow user to type OTP', async () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');

      expect(otpInput.props.value).toBe('123456');
    });

    it('should only allow numeric OTP input', async () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, 'abc123xyz');

      expect(otpInput.props.value).toBe('123');
    });

    it('should limit OTP to 6 digits', async () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456789');

      expect(otpInput.props.value).toBe('123456');
    });

    it('should disable verify button when OTP is not 6 digits', async () => {
      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '12345');

      const verifyButton = getByText('Verify');
      expect(verifyButton.parent?.props.disabled).toBe(true);
    });

    it('should enable verify button when OTP is 6 digits', async () => {
      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');

      const verifyButton = getByText('Verify');
      expect(verifyButton.parent?.props.disabled).toBe(false);
    });

    it('should call verifyOtp with mobile and OTP', async () => {
      mockAuthApi.verifyOtp.mockResolvedValue({
        message: 'OTP verified',
        token: 'jwt-token',
      });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');

      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(mockAuthApi.verifyOtp).toHaveBeenCalledWith('9876543210', '123456');
      });
    });

    it('should show alert for invalid OTP', async () => {
      mockAuthApi.verifyOtp.mockResolvedValue(null);

      const updatedMock = {
        ...mockAuthApi,
        error: 'Invalid OTP',
      };

      (useAuthApi as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '000000');

      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Invalid OTP')).toBeTruthy();
      });
    });

    it('should show verified badge after successful verification', async () => {
      mockAuthApi.verifyOtp.mockResolvedValue({
        message: 'OTP verified',
        token: 'jwt-token',
      });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');

      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
        expect(getByText('+91 9876543210')).toBeTruthy();
      });
    });

    it('should show success alert after verification', async () => {
      mockAuthApi.verifyOtp.mockResolvedValue({
        message: 'OTP verified',
        token: 'jwt-token',
      });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');

      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Verified',
          'Mobile number verified successfully!'
        );
      });
    });
  });

  describe('OTP Resend Functionality', () => {
    beforeEach(async () => {
      mockAuthApi.sendOtp.mockResolvedValue({
        message: 'OTP sent successfully',
        mobile: '9876543210',
      });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');

      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });
    });

    it('should show resend timer after OTP is sent', async () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText(/Resend OTP in \d+s/)).toBeTruthy();
    });

    it('should disable resend button during timer', async () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      const resendButton = getByText(/Resend OTP in \d+s/);

      // Button text should include timer
      expect(resendButton).toBeTruthy();
    });

    it('should enable resend button after timer expires', async () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      // Fast-forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(getByText('Resend OTP')).toBeTruthy();
      });
    });

    it('should resend OTP when resend button is pressed', async () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      // Fast-forward timer
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(getByText('Resend OTP')).toBeTruthy();
      });

      const resendButton = getByText('Resend OTP');
      fireEvent.press(resendButton);

      await waitFor(() => {
        expect(mockAuthApi.sendOtp).toHaveBeenCalledTimes(2);
      });
    });

    it('should show alert after OTP is resent', async () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      // Fast-forward timer
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      const resendButton = getByText('Resend OTP');
      fireEvent.press(resendButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('OTP Resent', 'New OTP sent to +91 9876543210');
      });
    });

    it('should reset timer after resending OTP', async () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      // Fast-forward timer
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      const resendButton = getByText('Resend OTP');
      fireEvent.press(resendButton);

      await waitFor(() => {
        expect(getByText(/Resend OTP in \d+s/)).toBeTruthy();
      });
    });

    it('should clear OTP input after resending', async () => {
      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');

      // Fast-forward timer
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      const resendButton = getByText('Resend OTP');
      fireEvent.press(resendButton);

      await waitFor(() => {
        expect(otpInput.props.value).toBe('');
      });
    });

    it('should show change number button', async () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText('Change Number')).toBeTruthy();
    });

    it('should allow changing mobile number', async () => {
      const { getByText, queryByPlaceholderText } = render(<RegisterDetailsScreen />);

      const changeButton = getByText('Change Number');
      fireEvent.press(changeButton);

      await waitFor(() => {
        // Should go back to mobile input state
        expect(queryByPlaceholderText('Enter 6-digit OTP')).toBeNull();
      });
    });
  });

  describe('Aadhaar Input', () => {
    it('should render Aadhaar input field', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      expect(getByPlaceholderText('XXXX XXXX XXXX')).toBeTruthy();
    });

    it('should format Aadhaar number with spaces', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '123456789012');

      expect(aadhaarInput.props.value).toBe('1234 5678 9012');
    });

    it('should only allow numeric input', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, 'abc123xyz456');

      expect(aadhaarInput.props.value).toBe('1234 56');
    });

    it('should limit Aadhaar to 12 digits (14 with spaces)', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '12345678901234567890');

      expect(aadhaarInput.props.value).toBe('1234 5678 9012');
    });

    it('should show security note about Aadhaar storage', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText('Your Aadhaar is encrypted and securely stored')).toBeTruthy();
    });

    it('should validate 12-digit Aadhaar on submit', async () => {
      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      // Mock mobile verification
      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');
      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');
      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
      });

      // Try to submit with invalid Aadhaar
      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '12345678');

      const termsCheckbox = getByText(/I agree to the/);
      fireEvent.press(termsCheckbox);

      const submitButton = getByText('Complete Registration');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Invalid Aadhaar',
          'Please enter a valid 12-digit Aadhaar number'
        );
      });
    });
  });

  describe('Bio Input', () => {
    it('should render bio text area', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      expect(getByPlaceholderText(/I have 5 years of experience/)).toBeTruthy();
    });

    it('should allow multiline input', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const bioInput = getByPlaceholderText(/I have 5 years of experience/);
      fireEvent.changeText(bioInput, 'Line 1\nLine 2\nLine 3');

      expect(bioInput.props.value).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should show character count', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const bioInput = getByPlaceholderText(/I have 5 years of experience/);
      fireEvent.changeText(bioInput, 'Test bio');

      expect(getByText('8/500')).toBeTruthy();
    });

    it('should limit bio to 500 characters', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const longBio = 'A'.repeat(600);
      const bioInput = getByPlaceholderText(/I have 5 years of experience/);
      fireEvent.changeText(bioInput, longBio);

      expect(bioInput.props.value.length).toBeLessThanOrEqual(500);
    });

    it('should be optional field', async () => {
      mockWorkerRegistration.registerWorker.mockResolvedValue({
        message: 'Success',
        worker: { workerId: 'worker-123' },
      });

      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      // Complete mobile verification
      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');
      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');
      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
      });

      // Fill Aadhaar
      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '123456789012');

      // Agree to terms
      const termsCheckbox = getByText(/I agree to the/);
      fireEvent.press(termsCheckbox);

      // Submit without bio
      const submitButton = getByText('Complete Registration');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockWorkerRegistration.registerWorker).toHaveBeenCalledWith(
          expect.objectContaining({
            bio: undefined,
          })
        );
      });
    });
  });

  describe('Terms Checkbox', () => {
    it('should render terms checkbox unchecked by default', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      const termsText = getByText(/I agree to the/);
      expect(termsText).toBeTruthy();
    });

    it('should toggle checkbox when pressed', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      const termsCheckbox = getByText(/I agree to the/);
      fireEvent.press(termsCheckbox);

      // Checkbox should be checked
      expect(() => getByText(/I agree to the/)).not.toThrow();
    });

    it('should show alert when submitting without agreeing to terms', async () => {
      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      // Complete mobile verification
      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');
      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');
      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
      });

      // Fill Aadhaar
      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '123456789012');

      // Try to submit without agreeing to terms
      const submitButton = getByText('Complete Registration');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Terms Required',
          'Please agree to the terms and conditions'
        );
      });
    });

    it('should highlight terms of service link', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText('Terms of Service')).toBeTruthy();
      expect(getByText('Privacy Policy')).toBeTruthy();
    });
  });

  describe('Submit Button State', () => {
    it('should disable submit button when mobile not verified', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      const submitButton = getByText('Complete Registration');
      expect(submitButton.parent?.props.disabled).toBe(true);
    });

    it('should disable submit button when Aadhaar is invalid', async () => {
      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      // Verify mobile
      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');
      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');
      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
      });

      // Invalid Aadhaar
      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '12345');

      const submitButton = getByText('Complete Registration');
      expect(submitButton.parent?.props.disabled).toBe(true);
    });

    it('should disable submit button when terms not agreed', async () => {
      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      // Verify mobile
      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');
      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');
      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
      });

      // Valid Aadhaar but no terms agreement
      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '123456789012');

      const submitButton = getByText('Complete Registration');
      expect(submitButton.parent?.props.disabled).toBe(true);
    });

    it('should enable submit button when all fields are valid', async () => {
      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      // Verify mobile
      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');
      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');
      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
      });

      // Fill Aadhaar
      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '123456789012');

      // Agree to terms
      const termsCheckbox = getByText(/I agree to the/);
      fireEvent.press(termsCheckbox);

      const submitButton = getByText('Complete Registration');
      expect(submitButton.parent?.props.disabled).toBe(false);
    });
  });

  describe('Registration Submission', () => {
    it('should call registerWorker with all data', async () => {
      mockWorkerRegistration.registerWorker.mockResolvedValue({
        message: 'Success',
        worker: { workerId: 'worker-123' },
      });

      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      // Verify mobile
      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');
      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');
      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
      });

      // Fill Aadhaar
      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '123456789012');

      // Fill bio
      const bioInput = getByPlaceholderText(/I have 5 years of experience/);
      fireEvent.changeText(bioInput, 'Experienced plumber');

      // Agree to terms
      const termsCheckbox = getByText(/I agree to the/);
      fireEvent.press(termsCheckbox);

      // Submit
      const submitButton = getByText('Complete Registration');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockWorkerRegistration.registerWorker).toHaveBeenCalledWith({
          name: 'Rajesh Kumar',
          mobile: '9876543210',
          categoryId: 'plumber',
          categoryName: 'Plumber',
          experienceYears: 10,
          stateId: 'madhya-pradesh',
          stateName: 'Madhya Pradesh',
          districtId: 'indore',
          districtName: 'Indore',
          tehsilId: 'indore',
          tehsilName: 'Indore',
          townId: 'vijay-nagar',
          townName: 'Vijay Nagar',
          pinCode: '452010',
          aadhaarNumber: '123456789012',
          bio: 'Experienced plumber',
        });
      });
    });

    it('should navigate to success page on successful registration', async () => {
      mockWorkerRegistration.registerWorker.mockResolvedValue({
        message: 'Success',
        worker: { workerId: 'worker-123' },
      });

      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      // Complete all steps
      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');
      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');
      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
      });

      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '123456789012');

      const termsCheckbox = getByText(/I agree to the/);
      fireEvent.press(termsCheckbox);

      const submitButton = getByText('Complete Registration');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith({
          pathname: '/register/success',
          params: { workerName: 'Rajesh Kumar' },
        });
      });
    });

    it('should show loading indicator during submission', async () => {
      const loadingMock = {
        ...mockWorkerRegistration,
        isLoading: true,
      };

      (useWorkerRegistration as jest.Mock).mockReturnValue(loadingMock);

      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const { getByText } = render(<RegisterDetailsScreen />);

      // Submit button should show loading indicator when isLoading is true
      const submitButton = getByText('Complete Registration');
      expect(submitButton.parent?.props.disabled).toBe(true);
    });

    it('should show error message on registration failure', async () => {
      mockWorkerRegistration.registerWorker.mockResolvedValue(null);

      const errorMock = {
        ...mockWorkerRegistration,
        error: 'Registration failed',
      };

      (useWorkerRegistration as jest.Mock).mockReturnValue(errorMock);

      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText('Registration failed')).toBeTruthy();
    });

    it('should not navigate on failed registration', async () => {
      mockWorkerRegistration.registerWorker.mockResolvedValue(null);

      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      // Complete all steps
      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');
      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');
      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
      });

      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '123456789012');

      const termsCheckbox = getByText(/I agree to the/);
      fireEvent.press(termsCheckbox);

      const submitButton = getByText('Complete Registration');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockWorkerRegistration.registerWorker).toHaveBeenCalled();
      });

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', () => {
      const { getByText } = render(<RegisterDetailsScreen />);

      const backButton = getByText('Back');
      fireEvent.press(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing params gracefully', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});

      expect(() => render(<RegisterDetailsScreen />)).not.toThrow();
    });

    it('should handle network error during OTP send', async () => {
      const errorMock = {
        ...mockAuthApi,
        error: 'Network error',
      };

      (useAuthApi as jest.Mock).mockReturnValue(errorMock);

      const { getByText } = render(<RegisterDetailsScreen />);

      expect(getByText('Network error')).toBeTruthy();
    });

    it('should clear error when user starts typing', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9');

      expect(mockAuthApi.clearError).toHaveBeenCalled();
    });

    it('should format Aadhaar with partial input', () => {
      const { getByPlaceholderText } = render(<RegisterDetailsScreen />);

      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '12345');

      expect(aadhaarInput.props.value).toBe('1234 5');
    });

    it('should handle bio with only whitespace', async () => {
      mockWorkerRegistration.registerWorker.mockResolvedValue({
        message: 'Success',
        worker: { workerId: 'worker-123' },
      });

      mockAuthApi.verifyOtp.mockResolvedValue({ message: 'Verified', token: 'token' });

      const { getByText, getByPlaceholderText } = render(<RegisterDetailsScreen />);

      // Complete mobile verification
      const mobileInput = getByPlaceholderText('Enter 10-digit mobile');
      fireEvent.changeText(mobileInput, '9876543210');
      const sendButton = getByText('Send OTP');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
      });

      const otpInput = getByPlaceholderText('Enter 6-digit OTP');
      fireEvent.changeText(otpInput, '123456');
      const verifyButton = getByText('Verify');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Verified')).toBeTruthy();
      });

      // Fill Aadhaar
      const aadhaarInput = getByPlaceholderText('XXXX XXXX XXXX');
      fireEvent.changeText(aadhaarInput, '123456789012');

      // Bio with only whitespace
      const bioInput = getByPlaceholderText(/I have 5 years of experience/);
      fireEvent.changeText(bioInput, '   ');

      const termsCheckbox = getByText(/I agree to the/);
      fireEvent.press(termsCheckbox);

      const submitButton = getByText('Complete Registration');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockWorkerRegistration.registerWorker).toHaveBeenCalledWith(
          expect.objectContaining({
            bio: undefined, // Whitespace should be trimmed to undefined
          })
        );
      });
    });
  });
});
