import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import * as api from '../../services/api';

describe('API Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('healthCheck', () => {
    it('returns healthy status', async () => {
      const response = await api.healthCheck();
      expect(response.success).toBe(true);
      expect(response.data?.status).toBe('healthy');
    });
  });

  describe('login', () => {
    it('logs in with valid credentials', async () => {
      const response = await api.login('test@example.com', 'password123');
      expect(response.success).toBe(true);
      expect(response.data?.user.email).toBe('test@example.com');
      expect(response.data?.accessToken).toBeTruthy();
    });

    it('fails with invalid credentials', async () => {
      server.use(
        http.post('http://localhost:3001/api/auth/login', () => {
          return HttpResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        })
      );

      const response = await api.login('bad@example.com', 'wrong');
      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid credentials');
    });
  });

  describe('signup', () => {
    it('creates a new account', async () => {
      const response = await api.signup('New User', 'new@example.com', 'password123');
      expect(response.success).toBe(true);
      expect(response.data?.user.name).toBe('New User');
      expect(response.data?.user.email).toBe('new@example.com');
    });
  });

  describe('logout', () => {
    it('logs out successfully', async () => {
      localStorage.setItem('accessToken', 'test-token');
      const response = await api.logout();
      expect(response.success).toBe(true);
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('returns user when authenticated', async () => {
      localStorage.setItem('accessToken', 'test-access-token');
      const response = await api.getCurrentUser();
      expect(response.success).toBe(true);
      expect(response.data?.email).toBe('test@example.com');
    });

    it('returns error when not authenticated', async () => {
      const response = await api.getCurrentUser();
      expect(response.success).toBe(false);
    });
  });

  describe('getImages', () => {
    it('returns empty array when no images', async () => {
      localStorage.setItem('accessToken', 'test-access-token');
      const response = await api.getImages();
      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
    });
  });

  describe('uploadImageBase64', () => {
    it('uploads image successfully', async () => {
      localStorage.setItem('accessToken', 'test-access-token');
      const response = await api.uploadImageBase64(
        'base64data',
        'image/png',
        'test.png'
      );
      expect(response.success).toBe(true);
      expect(response.data?.id).toBe('test-image-id');
    });
  });

  describe('getPlatforms', () => {
    it('returns list of platforms', async () => {
      const response = await api.getPlatforms();
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data?.[0].name).toBe('Instagram');
    });
  });

  describe('getPlatformConnections', () => {
    it('returns empty connections for new user', async () => {
      localStorage.setItem('accessToken', 'test-access-token');
      const response = await api.getPlatformConnections();
      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
    });
  });
});
