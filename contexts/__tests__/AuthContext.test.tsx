import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('initialization', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should load stored auth on mount', async () => {
      const mockUser = {
        mobile: '9876543210',
        workerId: 'worker-123',
        isWorker: true,
        isNewUser: false,
      };

      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve('stored-token-123');
        if (key === 'auth_user') return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('stored-token-123');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle no stored auth', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle error loading stored auth', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('SecureStore error')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading auth:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle malformed JSON in stored user', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve('stored-token');
        if (key === 'auth_user') return Promise.resolve('invalid-json{');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('login', () => {
    it('should save token and user to SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const testUser = {
        mobile: '9876543210',
        workerId: 'worker-123',
        isWorker: true,
        isNewUser: false,
      };

      await act(async () => {
        await result.current.login('new-token-123', testUser);
      });

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'new-token-123');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(testUser)
      );

      expect(result.current.token).toBe('new-token-123');
      expect(result.current.user).toEqual(testUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle new user login', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newUser = {
        mobile: '9876543210',
        isWorker: false,
        isNewUser: true,
      };

      await act(async () => {
        await result.current.login('token-456', newUser);
      });

      expect(result.current.user?.isNewUser).toBe(true);
      expect(result.current.user?.workerId).toBeUndefined();
      expect(result.current.user?.isWorker).toBe(false);
    });

    it('should throw error if SecureStore fails', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
        new Error('SecureStore write error')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const testUser = {
        mobile: '9876543210',
        isWorker: false,
        isNewUser: true,
      };

      await expect(
        act(async () => {
          await result.current.login('token', testUser);
        })
      ).rejects.toThrow();

      expect(result.current.token).toBe(null);
      expect(result.current.user).toBe(null);
    });
  });

  describe('logout', () => {
    it('should clear token and user from SecureStore', async () => {
      const mockUser = {
        mobile: '9876543210',
        workerId: 'worker-123',
        isWorker: true,
        isNewUser: false,
      };

      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve('stored-token');
        if (key === 'auth_user') return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_user');

      expect(result.current.token).toBe(null);
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle SecureStore error during logout', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(
        new Error('SecureStore delete error')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error clearing auth:',
        expect.any(Error)
      );

      // State should still be cleared even if SecureStore fails
      expect(result.current.token).toBe(null);
      expect(result.current.user).toBe(null);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve('token-123');
        if (key === 'auth_user')
          return Promise.resolve(
            JSON.stringify({ mobile: '9876543210', isWorker: false, isNewUser: true })
          );
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should return false when token does not exist', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('useAuth hook error handling', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleErrorSpy.mockRestore();
    });
  });
});
