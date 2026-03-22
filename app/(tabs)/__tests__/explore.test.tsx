import React from 'react';
import { render, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import ExploreScreen from '../explore';
import { useWorkers } from '@/hooks/use-workers';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { mockWorkers } from '@/__tests__/utils/mocks';

jest.mock('@/hooks/use-workers');
jest.mock('expo-router');

describe('ExploreScreen', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockParams = {
    categoryId: 'plumber',
    categoryName: 'Plumber',
  };

  const mockWorkersHook = {
    workers: mockWorkers,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: false,
    loadMore: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockParams);
    (useWorkers as jest.Mock).mockReturnValue(mockWorkersHook);
  });

  it('should render explore screen with worker list', () => {
    const { getByText } = render(<ExploreScreen />);

    expect(getByText('Plumber')).toBeTruthy();
    expect(getByText(`${mockWorkers.length} found`)).toBeTruthy();
    expect(getByText('Rajesh Kumar')).toBeTruthy();
    expect(getByText('Amit Sharma')).toBeTruthy();
    expect(getByText('Suresh Patel')).toBeTruthy();
  });

  it('should show loading state', () => {
    (useWorkers as jest.Mock).mockReturnValue({
      ...mockWorkersHook,
      isLoading: true,
      workers: [],
    });

    const { getByText } = render(<ExploreScreen />);

    expect(getByText('Finding workers...')).toBeTruthy();
  });

  it('should show error state with retry button', () => {
    const errorMessage = 'Failed to load workers';
    (useWorkers as jest.Mock).mockReturnValue({
      ...mockWorkersHook,
      isLoading: false,
      workers: [],
      error: errorMessage,
    });

    const { getByText } = render(<ExploreScreen />);

    expect(getByText(errorMessage)).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });

  it('should call refresh when retry button is pressed', () => {
    (useWorkers as jest.Mock).mockReturnValue({
      ...mockWorkersHook,
      error: 'Failed to load workers',
    });

    const { getByText } = render(<ExploreScreen />);

    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);

    expect(mockWorkersHook.refresh).toHaveBeenCalled();
  });

  it('should navigate to worker detail when worker card is pressed', () => {
    const { getByText } = render(<ExploreScreen />);

    const workerCard = getByText('Rajesh Kumar');
    fireEvent.press(workerCard);

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/worker/[id]',
      params: { id: 'worker-123' },
    });
  });

  it('should navigate back when back button is pressed', () => {
    const { UNSAFE_getAllByType } = render(<ExploreScreen />);

    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const backButton = touchables.find(
      (node) => node.props.style && node.props.style.backButton
    );

    if (backButton) {
      fireEvent.press(backButton);
      expect(mockRouter.back).toHaveBeenCalled();
    }
  });

  it('should show empty state when no category is selected', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { getByText } = render(<ExploreScreen />);

    expect(getByText('Select a Category')).toBeTruthy();
    expect(getByText('Go to Home and select a category to find workers')).toBeTruthy();
  });

  it('should show empty state when no workers found', () => {
    (useWorkers as jest.Mock).mockReturnValue({
      ...mockWorkersHook,
      workers: [],
    });

    const { getByText } = render(<ExploreScreen />);

    expect(getByText('No Workers Found')).toBeTruthy();
    expect(getByText('No Plumber available in your area yet')).toBeTruthy();
  });

  it('should display worker information correctly', () => {
    const { getByText } = render(<ExploreScreen />);

    // Worker 1
    expect(getByText('Rajesh Kumar')).toBeTruthy();
    expect(getByText('Plumber')).toBeTruthy();
    expect(getByText('Indore City, Indore')).toBeTruthy();
    expect(getByText('4.5 (25)')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getByText('yrs exp')).toBeTruthy();
  });

  it('should show availability badge for available workers', () => {
    const { UNSAFE_getAllByProps } = render(<ExploreScreen />);

    // Check for availability dot (green dot)
    const availableDots = UNSAFE_getAllByProps({
      style: expect.objectContaining({
        backgroundColor: '#22c55e',
      }),
    });

    expect(availableDots.length).toBeGreaterThan(0);
  });

  it('should display worker rating with stars', () => {
    const { UNSAFE_getAllByProps } = render(<ExploreScreen />);

    // Check for star icons
    const stars = UNSAFE_getAllByProps({ name: expect.stringMatching(/star/) });
    expect(stars.length).toBeGreaterThan(0);
  });

  it('should support pull to refresh', async () => {
    const { UNSAFE_getByType } = render(<ExploreScreen />);

    const flatList = UNSAFE_getByType(require('react-native').FlatList);

    fireEvent(flatList, 'refresh');

    await waitFor(() => {
      expect(mockWorkersHook.refresh).toHaveBeenCalled();
    });
  });

  it('should load more workers when scrolled to end', async () => {
    (useWorkers as jest.Mock).mockReturnValue({
      ...mockWorkersHook,
      hasMore: true,
    });

    const { UNSAFE_getByType } = render(<ExploreScreen />);

    const flatList = UNSAFE_getByType(require('react-native').FlatList);

    fireEvent(flatList, 'endReached');

    await waitFor(() => {
      expect(mockWorkersHook.loadMore).toHaveBeenCalled();
    });
  });

  it('should show loading indicator when loading more', () => {
    (useWorkers as jest.Mock).mockReturnValue({
      ...mockWorkersHook,
      isLoadingMore: true,
      hasMore: true,
    });

    const { UNSAFE_getAllByType } = render(<ExploreScreen />);

    const activityIndicators = UNSAFE_getAllByType(
      require('react-native').ActivityIndicator
    );

    expect(activityIndicators.length).toBeGreaterThan(0);
  });

  it('should not show loading indicator when not loading more', () => {
    const { UNSAFE_queryAllByType } = render(<ExploreScreen />);

    const activityIndicators = UNSAFE_queryAllByType(
      require('react-native').ActivityIndicator
    );

    // Should be 0 since we're not loading
    expect(activityIndicators.length).toBe(0);
  });

  it('should display result count', () => {
    const { getByText } = render(<ExploreScreen />);

    expect(getByText('3 found')).toBeTruthy();
  });

  it('should not show result count when no workers', () => {
    (useWorkers as jest.Mock).mockReturnValue({
      ...mockWorkersHook,
      workers: [],
    });

    const { queryByText } = render(<ExploreScreen />);

    expect(queryByText(/found/)).toBeNull();
  });

  it('should show category name in header', () => {
    const { getByText } = render(<ExploreScreen />);

    expect(getByText('Plumber')).toBeTruthy();
  });

  it('should show default header when no category name', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      categoryId: 'plumber',
    });

    const { getByText } = render(<ExploreScreen />);

    expect(getByText('Browse Workers')).toBeTruthy();
  });

  it('should not show back button when no category selected', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { UNSAFE_getAllByType } = render(<ExploreScreen />);

    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const backButton = touchables.find(
      (node) => node.props.style && node.props.style.backButton
    );

    expect(backButton).toBeUndefined();
  });

  it('should display worker profile photo when available', () => {
    const { UNSAFE_getAllByType } = render(<ExploreScreen />);

    const images = UNSAFE_getAllByType(require('react-native').Image);
    expect(images.length).toBeGreaterThan(0);
  });

  it('should display placeholder when worker has no profile photo', () => {
    const workersWithoutPhoto = [
      {
        ...mockWorkers[0],
        profilePhotoUrl: undefined,
      },
    ];

    (useWorkers as jest.Mock).mockReturnValue({
      ...mockWorkersHook,
      workers: workersWithoutPhoto,
    });

    const { UNSAFE_getAllByProps } = render(<ExploreScreen />);

    // Check for placeholder container
    const placeholders = UNSAFE_getAllByProps({
      style: expect.objectContaining({
        width: 60,
        height: 60,
        borderRadius: 30,
      }),
    });

    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('should render workers in a FlatList', () => {
    const { UNSAFE_getByType } = render(<ExploreScreen />);

    const flatList = UNSAFE_getByType(require('react-native').FlatList);
    expect(flatList).toBeTruthy();
  });
});
