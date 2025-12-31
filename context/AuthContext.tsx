import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, experienceLevel?: User['experienceLevel'], archiveSize?: User['archiveSize']) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for existing auth on mount
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshAuth();
    } else {
      setIsLoading(false);
    }
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login(email, password);
      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    experienceLevel?: User['experienceLevel'],
    archiveSize?: User['archiveSize']
  ) => {
    setIsLoading(true);
    try {
      const response = await api.signup(name, email, password, experienceLevel, archiveSize);
      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    try {
      const response = await api.googleAuth(idToken);
      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Google login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithGoogle,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
