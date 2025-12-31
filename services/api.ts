import { User, PlatformName, DistributionResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('accessToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    // Handle token refresh if needed
    if (response.status === 401 && data.error === 'Invalid or expired token') {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the original request
        const newToken = localStorage.getItem('accessToken');
        if (newToken) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        }
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        return retryResponse.json();
      }
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await response.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Auth API
export async function login(
  email: string,
  password: string
): Promise<ApiResponse<{ user: User; accessToken: string }>> {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(
  name: string,
  email: string,
  password: string,
  experienceLevel?: string,
  archiveSize?: string
): Promise<ApiResponse<{ user: User; accessToken: string }>> {
  return fetchApi('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, experienceLevel, archiveSize }),
  });
}

export async function googleAuth(
  idToken: string
): Promise<ApiResponse<{ user: User; accessToken: string }>> {
  return fetchApi('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export async function logout(): Promise<ApiResponse<void>> {
  const result = await fetchApi<void>('/auth/logout', { method: 'POST' });
  localStorage.removeItem('accessToken');
  return result;
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return fetchApi('/auth/me');
}

export async function updateUser(updates: {
  name?: string;
  experienceLevel?: string;
  archiveSize?: string;
}): Promise<ApiResponse<User>> {
  return fetchApi('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// Images API
export interface ImageRecord {
  id: string;
  user_id: string;
  filename: string;
  original_filename?: string;
  mime_type: string;
  file_size?: number;
  is_analyzed: boolean;
  is_distributed: boolean;
  created_at: string;
  updated_at: string;
}

export async function uploadImage(file: File): Promise<ApiResponse<ImageRecord>> {
  const token = localStorage.getItem('accessToken');
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    credentials: 'include',
  });

  return response.json();
}

export async function uploadImageBase64(
  base64: string,
  mimeType: string,
  filename?: string
): Promise<ApiResponse<ImageRecord>> {
  return fetchApi('/images/base64', {
    method: 'POST',
    body: JSON.stringify({ base64, mimeType, filename }),
  });
}

export async function getImages(
  includeAnalysis = false
): Promise<ApiResponse<ImageRecord[]>> {
  return fetchApi(`/images?includeAnalysis=${includeAnalysis}`);
}

export async function getImage(id: string): Promise<ApiResponse<ImageRecord>> {
  return fetchApi(`/images/${id}`);
}

export async function getImageBase64(
  id: string
): Promise<ApiResponse<{ base64: string; mimeType: string }>> {
  return fetchApi(`/images/${id}/base64`);
}

export async function deleteImage(id: string): Promise<ApiResponse<void>> {
  return fetchApi(`/images/${id}`, { method: 'DELETE' });
}

export async function saveAnalysis(
  imageId: string,
  analysis: {
    scores?: object;
    monetization?: object;
    curation?: object;
    socialStrategy?: object;
    marketComparison?: object;
    creativeRemixes?: object;
  }
): Promise<ApiResponse<unknown>> {
  return fetchApi(`/images/${imageId}/analysis`, {
    method: 'POST',
    body: JSON.stringify(analysis),
  });
}

export async function getAnalysis(imageId: string): Promise<ApiResponse<unknown>> {
  return fetchApi(`/images/${imageId}/analysis`);
}

// Platforms API
export interface PlatformInfo {
  name: PlatformName;
  category: 'Stock' | 'Print' | 'Social';
}

export interface PlatformConnectionInfo {
  platform: PlatformName;
  isConnected: boolean;
  accountName?: string;
  connectedAt: string;
}

export async function getPlatforms(): Promise<ApiResponse<PlatformInfo[]>> {
  return fetchApi('/platforms');
}

export async function getPlatformConnections(): Promise<
  ApiResponse<PlatformConnectionInfo[]>
> {
  return fetchApi('/platforms/connections');
}

export async function connectPlatform(
  platform: PlatformName,
  tokens: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    accountId?: string;
    accountName?: string;
  }
): Promise<ApiResponse<PlatformConnectionInfo>> {
  return fetchApi('/platforms/connect', {
    method: 'POST',
    body: JSON.stringify({ platform, ...tokens }),
  });
}

export async function disconnectPlatform(
  platform: PlatformName
): Promise<ApiResponse<void>> {
  return fetchApi(`/platforms/disconnect/${encodeURIComponent(platform)}`, {
    method: 'DELETE',
  });
}

export async function distributeImage(
  imageId: string,
  platforms: PlatformName[],
  metadata: {
    keywords?: string[];
    title?: string;
    description?: string;
    caption?: string;
  }
): Promise<
  ApiResponse<{
    results: { platform: string; success: boolean; error?: string; externalId?: string }[];
    summary: { total: number; successful: number; failed: number };
  }>
> {
  return fetchApi('/platforms/distribute', {
    method: 'POST',
    body: JSON.stringify({ imageId, platforms, ...metadata }),
  });
}

export async function getDistributionHistory(
  imageId?: string
): Promise<ApiResponse<DistributionResult[]>> {
  const query = imageId ? `?imageId=${imageId}` : '';
  return fetchApi(`/platforms/distribution-history${query}`);
}

// Health check
export async function healthCheck(): Promise<
  ApiResponse<{ status: string; timestamp: string; environment: string }>
> {
  return fetchApi('/health');
}
