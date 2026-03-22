import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api';

interface User {
  mobile: string;
  workerId?: string;
  isWorker: boolean;
  isNewUser: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken && storedUser) {
        // Safe JSON parse with validation
        try {
          const parsed = JSON.parse(storedUser);
          // Validate user structure
          if (parsed && typeof parsed.mobile === 'string') {
            setToken(storedToken);
            setUser(parsed);
            api.setToken(storedToken);
          } else {
            // Invalid user data, clear storage
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
          }
        } catch (parseError) {
          // Corrupted data, clear storage
          if (__DEV__) {
            console.error('Invalid stored user data:', parseError);
          }
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading auth:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      api.setToken(newToken);
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving auth:', error);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      setToken(null);
      setUser(null);
      api.setToken(null);
    } catch (error) {
      if (__DEV__) {
        console.error('Error clearing auth:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
