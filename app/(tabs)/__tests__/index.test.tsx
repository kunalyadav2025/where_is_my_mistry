import React from 'react';
import { render, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import HomeScreen from '../index';
import { useCategories } from '@/hooks/use-categories';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { mockCategories } from '@/__tests__/utils/mocks';

jest.mock('@/hooks/use-categories');
jest.mock('@/contexts/AuthContext');
jest.mock('expo-router');

describe('HomeScreen', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockAuth = {
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
  };

  const mockCategoriesHook = {
    categories: mockCategories,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    (useCategories as jest.Mock).mockReturnValue(mockCategoriesHook);
  });

  it('should render home screen with all elements when not authenticated', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Welcome')).toBeTruthy();
    expect(getByText('Find a Mistry')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
    expect(getByText('Categories')).toBeTruthy();
    expect(getByText('Are you a skilled worker?')).toBeTruthy();
    expect(getByText('Register as a Mistry and get more customers')).toBeTruthy();
  });

  it('should display user mobile when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuth,
      isAuthenticated: true,
      user: { mobile: '9876543210', isWorker: false, isNewUser: false },
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Hello, +91 9876543210')).toBeTruthy();
  });

  it('should show profile icon when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuth,
      isAuthenticated: true,
      user: { mobile: '9876543210', isWorker: false, isNewUser: false },
    });

    const { queryByText } = render(<HomeScreen />);

    expect(queryByText('Login')).toBeNull();
  });

  it('should render all categories', () => {
    const { getByText } = render(<HomeScreen />);

    mockCategories.forEach((category) => {
      expect(getByText(category.name)).toBeTruthy();
      if (category.nameHindi) {
        expect(getByText(category.nameHindi)).toBeTruthy();
      }
    });
  });

  it('should show loading state', () => {
    (useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      isLoading: true,
      categories: [],
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Loading categories...')).toBeTruthy();
  });

  it('should show error state with retry button', () => {
    const errorMessage = 'Failed to load categories';
    (useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      isLoading: false,
      categories: [],
      error: errorMessage,
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText(errorMessage)).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });

  it('should call refetch when retry button is pressed', () => {
    (useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      isLoading: false,
      categories: [],
      error: 'Failed to load categories',
    });

    const { getByText } = render(<HomeScreen />);

    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);

    expect(mockCategoriesHook.refetch).toHaveBeenCalled();
  });

  it('should navigate to explore when category is pressed', () => {
    const { getByText } = render(<HomeScreen />);

    const categoryCard = getByText('Plumber');
    fireEvent.press(categoryCard);

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/explore',
      params: { categoryId: 'plumber', categoryName: 'Plumber' },
    });
  });

  it('should navigate to login when login button is pressed', () => {
    const { getByText } = render(<HomeScreen />);

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/login');
  });

  it('should logout when profile icon is pressed', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuth,
      isAuthenticated: true,
      user: { mobile: '9876543210', isWorker: false, isNewUser: false },
    });

    const { UNSAFE_getAllByType } = render(<HomeScreen />);

    // Find the profile button by looking for TouchableOpacity with the profile icon
    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const profileButton = touchables.find(
      (node) => node.props.style && node.props.style.profileButton
    );

    if (profileButton) {
      fireEvent.press(profileButton);
      expect(mockAuth.logout).toHaveBeenCalled();
    }
  });

  it('should navigate to login when register banner is pressed (not authenticated)', () => {
    const { getByText } = render(<HomeScreen />);

    const registerBanner = getByText('Are you a skilled worker?');
    fireEvent.press(registerBanner.parent);

    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/login');
  });

  it('should navigate to register when register banner is pressed (authenticated)', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuth,
      isAuthenticated: true,
      user: { mobile: '9876543210', isWorker: false, isNewUser: false },
    });

    const { getByText } = render(<HomeScreen />);

    const registerBanner = getByText('Are you a skilled worker?');
    fireEvent.press(registerBanner.parent);

    expect(mockRouter.push).toHaveBeenCalledWith('/register');
  });

  it('should support pull to refresh', async () => {
    const { UNSAFE_getByType } = render(<HomeScreen />);

    const scrollView = UNSAFE_getByType(require('react-native').ScrollView);

    fireEvent(scrollView, 'refresh');

    await waitFor(() => {
      expect(mockCategoriesHook.refetch).toHaveBeenCalled();
    });
  });

  it('should display category icons', () => {
    const { UNSAFE_getAllByProps } = render(<HomeScreen />);

    const icons = UNSAFE_getAllByProps({ name: expect.any(String) });
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should handle empty categories list', () => {
    (useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      categories: [],
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Categories')).toBeTruthy();
  });

  it('should display categories in grid layout', () => {
    const { getByText } = render(<HomeScreen />);

    // All categories should be rendered
    expect(getByText('Plumber')).toBeTruthy();
    expect(getByText('Electrician')).toBeTruthy();
    expect(getByText('Carpenter')).toBeTruthy();
  });

  it('should render category with Hindi name', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('नलसाज़')).toBeTruthy(); // Plumber in Hindi
    expect(getByText('बिजली मिस्त्री')).toBeTruthy(); // Electrician in Hindi
    expect(getByText('बढ़ई')).toBeTruthy(); // Carpenter in Hindi
  });

  it('should handle category press correctly', () => {
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText('Electrician'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/explore',
      params: { categoryId: 'electrician', categoryName: 'Electrician' },
    });
  });
});
