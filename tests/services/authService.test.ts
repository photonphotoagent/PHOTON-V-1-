import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module before importing authService
vi.mock('../../services/api', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  googleAuth: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
  connectPlatform: vi.fn(),
  disconnectPlatform: vi.fn(),
  getPlatformConnections: vi.fn(),
}));

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_USE_BACKEND: 'false',
      VITE_API_URL: 'http://localhost:3001/api',
    },
  },
});

// Import after mocking
import * as authService from '../../services/authService.new';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('login (mock mode)', () => {
    it('succeeds with valid credentials', async () => {
      const user = await authService.login('test@example.com', 'password123');
      expect(user.email).toBe('test@example.com');
      expect(user.plan).toBe('Free');
    });

    it('fails with invalid email', async () => {
      await expect(authService.login('invalidemail', 'password123')).rejects.toThrow('Invalid credentials');
    });

    it('fails with short password', async () => {
      await expect(authService.login('test@example.com', '12345')).rejects.toThrow('Invalid credentials');
    });

    it('stores user in localStorage', async () => {
      await authService.login('test@example.com', 'password123');
      const stored = localStorage.getItem('photon_user');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!).email).toBe('test@example.com');
    });
  });

  describe('signup (mock mode)', () => {
    it('creates a new user', async () => {
      const user = await authService.signup('New User', 'new@example.com', 'password123');
      expect(user.name).toBe('New User');
      expect(user.email).toBe('new@example.com');
    });

    it('fails with short password', async () => {
      await expect(
        authService.signup('New User', 'new@example.com', '12345')
      ).rejects.toThrow();
    });

    it('accepts experience level and archive size', async () => {
      const user = await authService.signup(
        'New User',
        'new@example.com',
        'password123',
        'Pro',
        'Large'
      );
      expect(user.experienceLevel).toBe('Pro');
      expect(user.archiveSize).toBe('Large');
    });
  });

  describe('loginWithGoogle (mock mode)', () => {
    it('creates a mock Google user', async () => {
      const user = await authService.loginWithGoogle();
      expect(user.email).toBe('google.user@gmail.com');
      expect(user.name).toBe('Google User');
    });
  });

  describe('logout', () => {
    it('clears localStorage', async () => {
      localStorage.setItem('photon_user', JSON.stringify({ id: 'test' }));
      localStorage.setItem('accessToken', 'test-token');

      await authService.logout();

      expect(localStorage.getItem('photon_user')).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when no user stored', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('returns user from localStorage', () => {
      const mockUser = { id: 'test', email: 'test@example.com', name: 'Test' };
      localStorage.setItem('photon_user', JSON.stringify(mockUser));

      const user = authService.getCurrentUser();
      expect(user?.email).toBe('test@example.com');
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no user', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns true when user exists', () => {
      localStorage.setItem('photon_user', JSON.stringify({ id: 'test' }));
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('connectToPlatform (mock mode)', () => {
    it('succeeds for most platforms', async () => {
      const result = await authService.connectToPlatform('Instagram');
      expect(result.success).toBe(true);
    });
  });

  describe('disconnectFromPlatform (mock mode)', () => {
    it('succeeds', async () => {
      const result = await authService.disconnectFromPlatform('Instagram');
      expect(result.success).toBe(true);
    });
  });
});
