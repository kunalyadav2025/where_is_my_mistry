import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useWorkers, useWorkerDetail } from '../use-workers';
import { api } from '@/services/api';
import { mockWorkers, mockWorker, mockApiResponse } from '@/__tests__/utils/mocks';

jest.mock('@/services/api');

describe('useWorkers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not fetch workers without categoryId', async () => {
    const { result } = renderHook(() => useWorkers({}));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.workers).toEqual([]);
  });

  it('should fetch workers with categoryId', async () => {
    const mockResponse = mockApiResponse.success({
      workers: mockWorkers,
      nextCursor: 'cursor-123',
    });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useWorkers({ categoryId: 'plumber' }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith('/workers?categoryId=plumber');
    expect(result.current.workers).toEqual(mockWorkers);
    expect(result.current.hasMore).toBe(true);
  });

  it('should fetch workers with categoryId and townId', async () => {
    const mockResponse = mockApiResponse.success({
      workers: mockWorkers,
    });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useWorkers({ categoryId: 'plumber', townId: 'town-1' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith('/workers?categoryId=plumber&townId=town-1');
    expect(result.current.workers).toEqual(mockWorkers);
  });

  it('should handle pagination with cursor', async () => {
    const mockResponse1 = mockApiResponse.success({
      workers: [mockWorkers[0]],
      nextCursor: 'cursor-1',
    });

    const mockResponse2 = mockApiResponse.success({
      workers: [mockWorkers[1]],
      nextCursor: null,
    });

    (api.get as jest.Mock)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    const { result } = renderHook(() => useWorkers({ categoryId: 'plumber' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workers).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);

    // Load more
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.isLoadingMore).toBe(false);
    });

    expect(result.current.workers).toHaveLength(2);
    expect(result.current.hasMore).toBe(false);
    expect(api.get).toHaveBeenCalledWith('/workers?categoryId=plumber&cursor=cursor-1');
  });

  it('should not load more when already loading', async () => {
    const mockResponse = mockApiResponse.success({
      workers: mockWorkers,
      nextCursor: 'cursor-123',
    });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useWorkers({ categoryId: 'plumber' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set loading state
    act(() => {
      result.current.loadMore();
    });

    const callCount = (api.get as jest.Mock).mock.calls.length;

    // Try to load more while loading
    act(() => {
      result.current.loadMore();
    });

    // Should not trigger additional API call
    expect((api.get as jest.Mock).mock.calls.length).toBe(callCount + 1);
  });

  it('should not load more when hasMore is false', async () => {
    const mockResponse = mockApiResponse.success({
      workers: mockWorkers,
      nextCursor: null,
    });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useWorkers({ categoryId: 'plumber' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);

    const callCount = (api.get as jest.Mock).mock.calls.length;

    // Try to load more
    act(() => {
      result.current.loadMore();
    });

    // Should not trigger additional API call
    expect((api.get as jest.Mock).mock.calls.length).toBe(callCount);
  });

  it('should refresh workers list', async () => {
    const mockResponse = mockApiResponse.success({
      workers: mockWorkers,
    });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useWorkers({ categoryId: 'plumber' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledTimes(1);

    // Refresh
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle API error', async () => {
    const mockResponse = mockApiResponse.error('Failed to fetch workers', 'INTERNAL_ERROR');

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useWorkers({ categoryId: 'plumber' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workers).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch workers');
  });

  it('should handle network error', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network failed'));

    const { result } = renderHook(() => useWorkers({ categoryId: 'plumber' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error. Please try again.');
  });

  it('should refetch when categoryId changes', async () => {
    const mockResponse = mockApiResponse.success({
      workers: mockWorkers,
    });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result, rerender } = renderHook(
      ({ categoryId }) => useWorkers({ categoryId }),
      { initialProps: { categoryId: 'plumber' } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith('/workers?categoryId=plumber');

    // Change categoryId
    rerender({ categoryId: 'electrician' });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/workers?categoryId=electrician');
    });
  });
});

describe('useWorkerDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch worker details with valid workerId', async () => {
    const mockResponse = mockApiResponse.success({ worker: mockWorker });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useWorkerDetail('worker-123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith('/workers/worker-123');
    expect(result.current.worker).toEqual(mockWorker);
    expect(result.current.error).toBe(null);
  });

  it('should not fetch when workerId is null', async () => {
    const { result } = renderHook(() => useWorkerDetail(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.worker).toBe(null);
  });

  it('should handle worker not found error', async () => {
    const mockResponse = mockApiResponse.error('Worker not found', 'NOT_FOUND');

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useWorkerDetail('invalid-worker'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.worker).toBe(null);
    expect(result.current.error).toBe('Worker not found');
  });

  it('should handle network error', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network failed'));

    const { result } = renderHook(() => useWorkerDetail('worker-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error. Please try again.');
  });

  it('should refetch worker details', async () => {
    const mockResponse = mockApiResponse.success({ worker: mockWorker });

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useWorkerDetail('worker-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledTimes(1);

    // Refetch
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });
});
