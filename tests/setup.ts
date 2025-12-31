import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn().mockReturnValue({
    result: {
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          put: vi.fn(),
          get: vi.fn(),
          getAll: vi.fn().mockReturnValue({ result: [] }),
          delete: vi.fn(),
          clear: vi.fn(),
        }),
        oncomplete: null,
        onerror: null,
      }),
    },
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
  }),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
});

// MSW handlers
export const handlers = [
  // Auth endpoints
  http.post('http://localhost:3001/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email && body.password.length >= 6) {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: 'test-user-id',
            email: body.email,
            name: 'Test User',
            plan: 'Free',
          },
          accessToken: 'test-access-token',
        },
      });
    }
    return HttpResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('http://localhost:3001/api/auth/signup', async ({ request }) => {
    const body = await request.json() as { name: string; email: string; password: string };
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'new-user-id',
          email: body.email,
          name: body.name,
          plan: 'Free',
        },
        accessToken: 'new-access-token',
      },
    });
  }),

  http.post('http://localhost:3001/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('http://localhost:3001/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader === 'Bearer test-access-token') {
      return HttpResponse.json({
        success: true,
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          plan: 'Free',
        },
      });
    }
    return HttpResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }),

  // Images endpoints
  http.get('http://localhost:3001/api/images', () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  http.post('http://localhost:3001/api/images/base64', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'test-image-id',
        filename: 'test.png',
        mime_type: 'image/png',
        is_analyzed: false,
        is_distributed: false,
      },
    });
  }),

  // Platforms endpoints
  http.get('http://localhost:3001/api/platforms', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { name: 'Instagram', category: 'Social' },
        { name: 'Adobe Stock', category: 'Stock' },
      ],
    });
  }),

  http.get('http://localhost:3001/api/platforms/connections', () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  // Health check
  http.get('http://localhost:3001/api/health', () => {
    return HttpResponse.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'test',
      },
    });
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  localStorageMock.clear();
  server.resetHandlers();
});
afterAll(() => server.close());
