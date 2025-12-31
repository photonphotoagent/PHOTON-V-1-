import { PlatformName, User } from '../types';
import * as api from './api';

// Configuration
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

// --- Auth Functions ---

export const login = async (email: string, password: string): Promise<User> => {
  if (USE_BACKEND) {
    const response = await api.login(email, password);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed');
    }
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('photon_user', JSON.stringify(response.data.user));
    return response.data.user;
  }

  // Fallback to mock authentication
  if (!email.includes('@') || password.length < 6) {
    throw new Error('Invalid credentials');
  }

  const mockUser: User = {
    id: `user_${Date.now()}`,
    name: email.split('@')[0],
    email,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
    plan: 'Free',
    experienceLevel: 'Beginner',
    archiveSize: 'Small',
  };

  localStorage.setItem('photon_user', JSON.stringify(mockUser));
  return mockUser;
};

export const loginWithGoogle = async (idToken?: string): Promise<User> => {
  if (USE_BACKEND && idToken) {
    const response = await api.googleAuth(idToken);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Google login failed');
    }
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('photon_user', JSON.stringify(response.data.user));
    return response.data.user;
  }

  // Fallback to mock Google authentication
  const mockUser: User = {
    id: `google_user_${Date.now()}`,
    name: 'Google User',
    email: 'google.user@gmail.com',
    avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    plan: 'Free',
    experienceLevel: 'Enthusiast',
    archiveSize: 'Medium',
  };

  localStorage.setItem('photon_user', JSON.stringify(mockUser));
  return mockUser;
};

export const signup = async (
  name: string,
  email: string,
  password: string,
  experienceLevel?: User['experienceLevel'],
  archiveSize?: User['archiveSize']
): Promise<User> => {
  if (USE_BACKEND) {
    const response = await api.signup(name, email, password, experienceLevel, archiveSize);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Signup failed');
    }
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('photon_user', JSON.stringify(response.data.user));
    return response.data.user;
  }

  // Fallback to mock signup
  if (!email || password.length < 6) {
    throw new Error('Please fill out all fields with valid data');
  }

  const mockUser: User = {
    id: `user_${Date.now()}`,
    name,
    email,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
    plan: 'Free',
    experienceLevel: experienceLevel || 'Beginner',
    archiveSize: archiveSize || 'Small',
  };

  localStorage.setItem('photon_user', JSON.stringify(mockUser));
  return mockUser;
};

export const logout = async (): Promise<void> => {
  if (USE_BACKEND) {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }

  localStorage.removeItem('photon_user');
  localStorage.removeItem('accessToken');
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem('photon_user');
  return stored ? JSON.parse(stored) : null;
};

export const updateUser = async (updates: Partial<User>): Promise<User> => {
  if (USE_BACKEND) {
    const response = await api.updateUser({
      name: updates.name,
      experienceLevel: updates.experienceLevel,
      archiveSize: updates.archiveSize,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Update failed');
    }

    localStorage.setItem('photon_user', JSON.stringify(response.data));
    return response.data;
  }

  // Fallback to local update
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('No user logged in');
  }

  const updatedUser = { ...currentUser, ...updates };
  localStorage.setItem('photon_user', JSON.stringify(updatedUser));
  return updatedUser;
};

// --- Platform Connection Functions ---

export const connectToPlatform = async (
  platform: PlatformName,
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
    accountName?: string;
  }
): Promise<{ success: boolean }> => {
  console.log(`Initiating connection to ${platform}...`);

  if (USE_BACKEND && tokens) {
    const response = await api.connectPlatform(platform, tokens);
    return { success: response.success };
  }

  // Fallback to mock connection
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  // Simulate occasional failures for Getty Images
  if (platform === 'Getty Images' && Math.random() < 0.3) {
    console.error(`Failed to connect to ${platform}.`);
    return { success: false };
  }

  console.log(`Successfully connected to ${platform}.`);
  return { success: true };
};

export const disconnectFromPlatform = async (
  platform: PlatformName
): Promise<{ success: boolean }> => {
  console.log(`Disconnecting from ${platform}...`);

  if (USE_BACKEND) {
    const response = await api.disconnectPlatform(platform);
    return { success: response.success };
  }

  // Fallback to mock disconnection
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));
  console.log(`Successfully disconnected from ${platform}.`);
  return { success: true };
};

export const getPlatformConnections = async (): Promise<
  { platform: PlatformName; isConnected: boolean; accountName?: string }[]
> => {
  if (USE_BACKEND) {
    const response = await api.getPlatformConnections();
    if (response.success && response.data) {
      return response.data;
    }
  }

  // Return empty array for mock mode
  return [];
};

// --- Token Management ---

export const refreshAccessToken = async (): Promise<boolean> => {
  if (!USE_BACKEND) {
    return true; // No token refresh needed in mock mode
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    if (data.success && data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

export const isAuthenticated = (): boolean => {
  const user = getCurrentUser();
  const token = localStorage.getItem('accessToken');

  if (USE_BACKEND) {
    return !!user && !!token;
  }

  return !!user;
};
