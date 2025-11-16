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
  isAuthenticated: () => boolean;
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
          isAuthenticated: () => true,
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
          isAuthenticated: () => false,
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

  it('should call restoreSession on mount', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        const mockState: MockAuthState = {
          isAuthenticated: () => true,
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

    expect(mockRestoreSession).toHaveBeenCalledTimes(1);
  });

  it('should restore session before checking authentication', () => {
    let isAuth = false;
    const mockRestore = vi.fn(() => {
      // Simulate session restoration making user authenticated
      isAuth = true;
    });

    vi.mocked(useAuthStore).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        const mockState: MockAuthState = {
          isAuthenticated: () => isAuth,
          restoreSession: mockRestore,
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

    expect(mockRestore).toHaveBeenCalled();
  });
});
