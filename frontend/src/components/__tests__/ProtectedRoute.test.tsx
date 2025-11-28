import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuthStore } from '../../stores/authStore';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

interface MockAuthState {
  user: null;
  token: null;
  isLoading: boolean;
  isAuthenticated: () => boolean;
  setUser: () => void;
  setToken: () => void;
  login: () => Promise<void>;
  register: () => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
}

describe('ProtectedRoute', () => {
  const mockRestoreSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        const mockState: MockAuthState = {
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: () => true,
          setUser: vi.fn(),
          setToken: vi.fn(),
          login: vi.fn().mockResolvedValue(undefined),
          register: vi.fn().mockResolvedValue(undefined),
          logout: vi.fn(),
          restoreSession: mockRestoreSession,
        };
        return selector(mockState);
      }
      return null;
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        const mockState: MockAuthState = {
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: () => false,
          setUser: vi.fn(),
          setToken: vi.fn(),
          login: vi.fn().mockResolvedValue(undefined),
          register: vi.fn().mockResolvedValue(undefined),
          logout: vi.fn(),
          restoreSession: mockRestoreSession,
        };
        return selector(mockState);
      }
      return null;
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  // Note: Session restoration is now handled in App.tsx, not in ProtectedRoute
  // These tests have been removed as ProtectedRoute no longer calls restoreSession()
});
