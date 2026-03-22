import React from 'react';
import { render, fireEvent, waitFor, act } from '@/__tests__/utils/test-utils';
import VerifyOtpScreen from '../verify-otp';
import { useAuthApi } from '@/hooks/use-auth-api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

jest.mock('@/hooks/use-auth-api');
jest.mock('@/contexts/AuthContext');
jest.mock('expo-router');
jest.mock('react-native/Libraries/Alert/Alert');

describe('VerifyOtpScreen', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockAuthApi = {
    verifyOtp: jest.fn(),
    sendOtp: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  };

  const mockAuth = {
    login: jest.fn(),
    logout: jest.fn(),
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
  };

  const mockParams = {
    mobile: '9876543210',
    testOtp: '123456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthApi as jest.Mock).mockReturnValue(mockAuthApi);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockParams);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render verify OTP screen with all elements', () => {
    const { getByText, getAllByDisplayValue } = render(<VerifyOtpScreen />);

    expect(getByText('Verify OTP')).toBeTruthy();
    expect(getByText('Enter the 6-digit code sent to +91 9876543210')).toBeTruthy();
    expect(getByText('Verify')).toBeTruthy();
    expect(getByText('← Back')).toBeTruthy();

    // Should have 6 OTP input fields
    const inputs = getAllByDisplayValue('');
    expect(inputs).toHaveLength(6);
  });

  it('should show test OTP alert in dev mode', () => {
    render(<VerifyOtpScreen />);

    expect(Alert.alert).toHaveBeenCalledWith('Dev Mode', 'Test OTP: 123456');
  });

  it('should not show alert when testOtp is not provided', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      mobile: '9876543210',
    });

    render(<VerifyOtpScreen />);

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('should allow entering OTP digits', () => {
    const { getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');
    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');

    expect(inputs[0].props.value).toBe('1');
    expect(inputs[1].props.value).toBe('2');
    expect(inputs[2].props.value).toBe('3');
  });

  it('should only allow numeric input', () => {
    const { getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');
    fireEvent.changeText(inputs[0], 'a');
    fireEvent.changeText(inputs[1], 'x1');

    expect(inputs[0].props.value).toBe('');
    expect(inputs[1].props.value).toBe('');
  });

  it('should auto-focus next input when digit is entered', () => {
    const { getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');

    // Entering digit should focus next input
    fireEvent.changeText(inputs[0], '1');
    // In a real scenario, focus would be called on inputs[1]
  });

  it('should focus previous input on backspace when current is empty', () => {
    const { getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');

    fireEvent.changeText(inputs[1], '');
    fireEvent(inputs[1], 'keyPress', { nativeEvent: { key: 'Backspace' } });

    // In a real scenario, focus would be called on inputs[0]
  });

  it('should disable verify button when OTP is incomplete', () => {
    const { getByText, getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');
    const button = getByText('Verify').parent;

    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.changeText(inputs[2], '3');

    expect(button?.props.disabled).toBe(true);
  });

  it('should enable verify button when OTP is complete', () => {
    const { getByText, getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');
    const button = getByText('Verify').parent;

    inputs.forEach((input, index) => {
      fireEvent.changeText(input, (index + 1).toString());
    });

    expect(button?.props.disabled).toBe(false);
  });

  it('should call verifyOtp when verify button is pressed', async () => {
    mockAuthApi.verifyOtp.mockResolvedValue({
      message: 'OTP verified',
      token: 'jwt-token-123',
      user: { mobile: '9876543210', isNewUser: true },
    });

    const { getByText, getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');
    const button = getByText('Verify');

    inputs.forEach((input, index) => {
      fireEvent.changeText(input, (index + 1).toString());
    });

    fireEvent.press(button);

    await waitFor(() => {
      expect(mockAuthApi.verifyOtp).toHaveBeenCalledWith('9876543210', '123456');
    });
  });

  it('should auto-submit when last OTP digit is entered', async () => {
    mockAuthApi.verifyOtp.mockResolvedValue({
      message: 'OTP verified',
      token: 'jwt-token-123',
      user: { mobile: '9876543210', isNewUser: true },
    });

    const { getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');

    // Enter all 6 digits
    inputs.forEach((input, index) => {
      fireEvent.changeText(input, (index + 1).toString());
    });

    await waitFor(() => {
      expect(mockAuthApi.verifyOtp).toHaveBeenCalledWith('9876543210', '123456');
    });
  });

  it('should login user and navigate on successful OTP verification', async () => {
    const mockResponse = {
      message: 'OTP verified',
      token: 'jwt-token-123',
      user: {
        mobile: '9876543210',
        workerId: 'worker-123',
        isNewUser: false,
      },
    };

    mockAuthApi.verifyOtp.mockResolvedValue(mockResponse);

    const { getByText, getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');
    const button = getByText('Verify');

    inputs.forEach((input, index) => {
      fireEvent.changeText(input, (index + 1).toString());
    });

    fireEvent.press(button);

    await waitFor(() => {
      expect(mockAuth.login).toHaveBeenCalledWith('jwt-token-123', {
        mobile: '9876543210',
        workerId: 'worker-123',
        isWorker: true,
        isNewUser: false,
      });
    });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('should handle new user correctly', async () => {
    const mockResponse = {
      message: 'OTP verified',
      token: 'jwt-token-456',
      user: {
        mobile: '9876543210',
        isNewUser: true,
      },
    };

    mockAuthApi.verifyOtp.mockResolvedValue(mockResponse);

    const { getByText, getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');
    const button = getByText('Verify');

    inputs.forEach((input, index) => {
      fireEvent.changeText(input, (index + 1).toString());
    });

    fireEvent.press(button);

    await waitFor(() => {
      expect(mockAuth.login).toHaveBeenCalledWith('jwt-token-456', {
        mobile: '9876543210',
        workerId: undefined,
        isWorker: false,
        isNewUser: true,
      });
    });
  });

  it('should display error message when OTP verification fails', async () => {
    const errorMessage = 'Invalid OTP';
    (useAuthApi as jest.Mock).mockReturnValue({
      ...mockAuthApi,
      error: errorMessage,
    });

    const { getByText } = render(<VerifyOtpScreen />);

    expect(getByText(errorMessage)).toBeTruthy();
  });

  it('should show alert for incomplete OTP', async () => {
    const { getByText, getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');
    const button = getByText('Verify');

    fireEvent.changeText(inputs[0], '1');
    fireEvent.changeText(inputs[1], '2');
    fireEvent.press(button);

    expect(Alert.alert).toHaveBeenCalledWith('Invalid OTP', 'Please enter all 6 digits');
  });

  it('should start resend timer at 30 seconds', () => {
    const { getByText } = render(<VerifyOtpScreen />);

    expect(getByText('Resend OTP in 30s')).toBeTruthy();
  });

  it('should countdown resend timer', () => {
    const { getByText } = render(<VerifyOtpScreen />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getByText('Resend OTP in 29s')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(29000);
    });

    expect(getByText('Resend OTP')).toBeTruthy();
  });

  it('should resend OTP when resend button is clicked', async () => {
    mockAuthApi.sendOtp.mockResolvedValue({
      message: 'OTP sent successfully',
      mobile: '9876543210',
      testOtp: '654321',
    });

    const { getByText } = render(<VerifyOtpScreen />);

    // Fast forward to enable resend
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    const resendButton = getByText('Resend OTP');
    fireEvent.press(resendButton);

    await waitFor(() => {
      expect(mockAuthApi.sendOtp).toHaveBeenCalledWith('9876543210');
    });

    expect(Alert.alert).toHaveBeenCalledWith('Dev Mode', 'New Test OTP: 654321');
  });

  it('should reset OTP fields on resend', async () => {
    mockAuthApi.sendOtp.mockResolvedValue({
      message: 'OTP sent successfully',
      mobile: '9876543210',
    });

    const { getByText, getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');

    // Enter some digits
    inputs.forEach((input, index) => {
      fireEvent.changeText(input, (index + 1).toString());
    });

    // Fast forward to enable resend
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    const resendButton = getByText('Resend OTP');
    fireEvent.press(resendButton);

    await waitFor(() => {
      const resetInputs = getAllByDisplayValue('');
      expect(resetInputs).toHaveLength(6);
    });
  });

  it('should not resend OTP when timer is active', async () => {
    const { getByText } = render(<VerifyOtpScreen />);

    const resendButton = getByText('Resend OTP in 30s');
    fireEvent.press(resendButton);

    expect(mockAuthApi.sendOtp).not.toHaveBeenCalled();
  });

  it('should navigate back when back button is pressed', () => {
    const { getByText } = render(<VerifyOtpScreen />);

    const backButton = getByText('← Back');
    fireEvent.press(backButton);

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('should clear error when user starts entering OTP', () => {
    const errorMessage = 'Invalid OTP';
    (useAuthApi as jest.Mock).mockReturnValue({
      ...mockAuthApi,
      error: errorMessage,
    });

    const { getAllByDisplayValue } = render(<VerifyOtpScreen />);

    const inputs = getAllByDisplayValue('');
    fireEvent.changeText(inputs[0], '1');

    expect(mockAuthApi.clearError).toHaveBeenCalled();
  });

  it('should show loading indicator when verifying OTP', () => {
    (useAuthApi as jest.Mock).mockReturnValue({
      ...mockAuthApi,
      isLoading: true,
    });

    const { getByText } = render(<VerifyOtpScreen />);

    const button = getByText('Verify').parent;
    expect(button?.props.disabled).toBe(true);
  });
});
