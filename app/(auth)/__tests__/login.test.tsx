import React from 'react';
import { render, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import LoginScreen from '../login';
import { useAuthApi } from '@/hooks/use-auth-api';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

jest.mock('@/hooks/use-auth-api');
jest.mock('expo-router');
jest.mock('react-native/Libraries/Alert/Alert');

describe('LoginScreen', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockAuthApi = {
    sendOtp: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthApi as jest.Mock).mockReturnValue(mockAuthApi);
  });

  it('should render login screen with all elements', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    expect(getByText('Where is My Mistry?')).toBeTruthy();
    expect(getByText('Find skilled workers near you')).toBeTruthy();
    expect(getByText('Mobile Number')).toBeTruthy();
    expect(getByText('+91')).toBeTruthy();
    expect(getByPlaceholderText('Enter 10-digit number')).toBeTruthy();
    expect(getByText('Send OTP')).toBeTruthy();
    expect(
      getByText('By continuing, you agree to our Terms of Service and Privacy Policy')
    ).toBeTruthy();
  });

  it('should allow user to type mobile number', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    fireEvent.changeText(input, '9876543210');

    expect(input.props.value).toBe('9876543210');
  });

  it('should only allow numeric input', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    fireEvent.changeText(input, 'abc123xyz');

    expect(input.props.value).toBe('123');
  });

  it('should limit mobile number to 10 digits', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    fireEvent.changeText(input, '98765432109999');

    expect(input.props.value).toBe('9876543210');
  });

  it('should disable send OTP button when mobile number is not 10 digits', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    const button = getByText('Send OTP').parent;

    fireEvent.changeText(input, '987654321');

    expect(button?.props.disabled).toBe(true);
  });

  it('should enable send OTP button when mobile number is 10 digits', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    const button = getByText('Send OTP').parent;

    fireEvent.changeText(input, '9876543210');

    expect(button?.props.disabled).toBe(false);
  });

  it('should show alert for invalid mobile number length', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    const button = getByText('Send OTP');

    fireEvent.changeText(input, '987654321');
    fireEvent.press(button);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Number',
      'Please enter a valid 10-digit mobile number'
    );
  });

  it('should show alert for mobile number not starting with 6-9', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    const button = getByText('Send OTP');

    fireEvent.changeText(input, '5876543210');
    fireEvent.press(button);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Number',
      'Mobile number must start with 6, 7, 8, or 9'
    );
  });

  it('should call sendOtp with valid mobile number', async () => {
    mockAuthApi.sendOtp.mockResolvedValue({
      message: 'OTP sent successfully',
      mobile: '9876543210',
    });

    (useAuthApi as jest.Mock).mockReturnValue(mockAuthApi);

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    const button = getByText('Send OTP');

    fireEvent.changeText(input, '9876543210');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockAuthApi.sendOtp).toHaveBeenCalledWith('9876543210');
    });
  });

  it('should navigate to OTP verification on successful OTP send', async () => {
    const testOtp = '123456';
    mockAuthApi.sendOtp.mockResolvedValue({
      message: 'OTP sent successfully',
      mobile: '9876543210',
      testOtp,
    });

    (useAuthApi as jest.Mock).mockReturnValue(mockAuthApi);

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    const button = getByText('Send OTP');

    fireEvent.changeText(input, '9876543210');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(auth)/verify-otp',
        params: { mobile: '9876543210', testOtp },
      });
    });
  });

  it('should not navigate if sendOtp fails', async () => {
    mockAuthApi.sendOtp.mockResolvedValue(null);

    (useAuthApi as jest.Mock).mockReturnValue(mockAuthApi);

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    const button = getByText('Send OTP');

    fireEvent.changeText(input, '9876543210');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockAuthApi.sendOtp).toHaveBeenCalled();
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('should display error message when present', () => {
    const errorMessage = 'Too many requests. Please try again later.';
    (useAuthApi as jest.Mock).mockReturnValue({
      ...mockAuthApi,
      error: errorMessage,
    });

    const { getByText } = render(<LoginScreen />);

    expect(getByText(errorMessage)).toBeTruthy();
  });

  it('should show loading indicator when isLoading is true', () => {
    (useAuthApi as jest.Mock).mockReturnValue({
      ...mockAuthApi,
      isLoading: true,
    });

    const { getByText, UNSAFE_getByType } = render(<LoginScreen />);

    const button = getByText('Send OTP').parent;
    expect(button?.props.disabled).toBe(true);
  });

  it('should clear error when user starts typing', () => {
    const errorMessage = 'Some error';
    (useAuthApi as jest.Mock).mockReturnValue({
      ...mockAuthApi,
      error: errorMessage,
    });

    const { getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    fireEvent.changeText(input, '9');

    expect(mockAuthApi.clearError).toHaveBeenCalled();
  });

  it('should validate mobile numbers starting with 6', async () => {
    mockAuthApi.sendOtp.mockResolvedValue({
      message: 'OTP sent successfully',
      mobile: '6876543210',
    });

    (useAuthApi as jest.Mock).mockReturnValue(mockAuthApi);

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    const button = getByText('Send OTP');

    fireEvent.changeText(input, '6876543210');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockAuthApi.sendOtp).toHaveBeenCalledWith('6876543210');
    });
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('should validate mobile numbers starting with 9', async () => {
    mockAuthApi.sendOtp.mockResolvedValue({
      message: 'OTP sent successfully',
      mobile: '9876543210',
    });

    (useAuthApi as jest.Mock).mockReturnValue(mockAuthApi);

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const input = getByPlaceholderText('Enter 10-digit number');
    const button = getByText('Send OTP');

    fireEvent.changeText(input, '9876543210');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockAuthApi.sendOtp).toHaveBeenCalledWith('9876543210');
    });
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
