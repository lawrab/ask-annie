import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import * as api from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({ user: null, token: null });

    // Clear localStorage
    localStorage.clear();

    // Clear all mocks
    vi.clearAllMocks();

    // Setup default mock for logout to return a resolved promise
    vi.mocked(api.authApi.logout).mockResolvedValue();
  });

  describe('initial state', () => {
    it('should have null user and token', () => {
      const { user, token } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(token).toBeNull();
    });

    it('should not be authenticated initially', () => {
      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('login', () => {
    it('should set user and token on successful login', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        notificationTimes: ['08:00'],
        notificationsEnabled: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      const mockToken = 'mock-jwt-token';

      vi.mocked(api.authApi.login).mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: mockToken,
        },
      });

      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');

      const { user, token } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(token).toBe(mockToken);
    });

    it('should persist user and token to localStorage', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        notificationTimes: ['08:00'],
        notificationsEnabled: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      const mockToken = 'mock-jwt-token';

      vi.mocked(api.authApi.login).mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: mockToken,
        },
      });

      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');

      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('should mark user as authenticated after login', async () => {
      vi.mocked(api.authApi.login).mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '123',
            username: 'testuser',
            email: 'test@example.com',
            notificationTimes: ['08:00'],
            notificationsEnabled: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          token: 'mock-token',
        },
      });

      const { login, isAuthenticated } = useAuthStore.getState();
      await login('test@example.com', 'password123');

      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('register', () => {
    it('should set user and token on successful registration', async () => {
      const mockUser = {
        id: '456',
        username: 'newuser',
        email: 'new@example.com',
        notificationTimes: ['08:00'],
        notificationsEnabled: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      const mockToken = 'new-mock-token';

      vi.mocked(api.authApi.register).mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: mockToken,
        },
      });

      const { register } = useAuthStore.getState();
      await register('newuser', 'new@example.com', 'password123');

      const { user, token } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(token).toBe(mockToken);
    });

    it('should persist user and token to localStorage', async () => {
      const mockUser = {
        id: '456',
        username: 'newuser',
        email: 'new@example.com',
        notificationTimes: ['08:00'],
        notificationsEnabled: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      const mockToken = 'new-mock-token';

      vi.mocked(api.authApi.register).mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: mockToken,
        },
      });

      const { register } = useAuthStore.getState();
      await register('newuser', 'new@example.com', 'password123');

      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });
  });

  describe('logout', () => {
    beforeEach(async () => {
      // Setup authenticated state
      vi.mocked(api.authApi.login).mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '123',
            username: 'testuser',
            email: 'test@example.com',
            notificationTimes: ['08:00'],
            notificationsEnabled: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          token: 'mock-token',
        },
      });

      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');
    });

    it('should clear user and token', () => {
      const { logout } = useAuthStore.getState();
      logout();

      const { user, token } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(token).toBeNull();
    });

    it('should clear localStorage', () => {
      const { logout } = useAuthStore.getState();
      logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should mark user as not authenticated', () => {
      const { logout, isAuthenticated } = useAuthStore.getState();
      logout();

      expect(isAuthenticated()).toBe(false);
    });

    it('should call API logout', () => {
      vi.mocked(api.authApi.logout).mockResolvedValue();

      const { logout } = useAuthStore.getState();
      logout();

      expect(api.authApi.logout).toHaveBeenCalled();
    });

    it('should not throw if API logout fails', () => {
      vi.mocked(api.authApi.logout).mockRejectedValue(new Error('Network error'));

      const { logout } = useAuthStore.getState();

      expect(() => logout()).not.toThrow();
    });
  });

  describe('restoreSession', () => {
    it('should restore user and token from localStorage', () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        notificationTimes: ['08:00'],
        notificationsEnabled: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      const mockToken = 'stored-token';

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      const { restoreSession } = useAuthStore.getState();
      restoreSession();

      const { user, token } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(token).toBe(mockToken);
    });

    it('should not restore if token is missing', () => {
      localStorage.setItem('user', JSON.stringify({ id: '123' }));

      const { restoreSession } = useAuthStore.getState();
      restoreSession();

      const { user, token } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(token).toBeNull();
    });

    it('should not restore if user is missing', () => {
      localStorage.setItem('token', 'some-token');

      const { restoreSession } = useAuthStore.getState();
      restoreSession();

      const { user, token } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(token).toBeNull();
    });

    it('should clear localStorage if user data is invalid JSON', () => {
      localStorage.setItem('token', 'some-token');
      localStorage.setItem('user', 'invalid-json{');

      const { restoreSession } = useAuthStore.getState();
      restoreSession();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user and token exist', async () => {
      vi.mocked(api.authApi.login).mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '123',
            username: 'testuser',
            email: 'test@example.com',
            notificationTimes: ['08:00'],
            notificationsEnabled: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          token: 'mock-token',
        },
      });

      const { login, isAuthenticated } = useAuthStore.getState();
      await login('test@example.com', 'password123');

      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when user is null', () => {
      useAuthStore.setState({ user: null, token: 'some-token' });

      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false when token is null', () => {
      useAuthStore.setState({
        user: {
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
          notificationTimes: ['08:00'],
          notificationsEnabled: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        token: null,
      });

      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false when both are null', () => {
      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated()).toBe(false);
    });
  });
});
