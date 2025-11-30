import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import MagicLinkVerifyPage from '../MagicLinkVerifyPage';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

// Mock react-router navigation
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MagicLinkVerifyPage', () => {
  const mockSetUser = vi.fn();
  const mockSetToken = vi.fn();
  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      const state = {
        setUser: mockSetUser,
        setToken: mockSetToken,
      };
      return selector(state);
    });
  });

  const renderWithToken = (token?: string) => {
    const initialEntries = token ? [`/verify?token=${token}`] : ['/verify'];
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <MagicLinkVerifyPage />
      </MemoryRouter>
    );
  };

  describe('Initial state', () => {
    it('shows verifying state initially with spinner', () => {
      vi.mocked(api.post).mockImplementation(() => new Promise(() => {})); // Never resolves
      renderWithToken('valid-token');

      expect(screen.getByText('Verifying your login link...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we sign you in')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Missing token', () => {
    it('shows error when no token provided', async () => {
      renderWithToken(); // No token

      await waitFor(() => {
        expect(screen.getByText('Verification failed')).toBeInTheDocument();
      });

      expect(screen.getByText('No token provided. Please request a new login link.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /request a new login link/i })).toBeInTheDocument();
    });
  });

  describe('Successful verification', () => {
    beforeEach(() => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: {
            user: mockUser,
            token: 'jwt-token',
          },
        },
      });
    });

    it('shows success message and sets auth state', async () => {
      renderWithToken('valid-token');

      await waitFor(() => {
        expect(screen.getByText('Successfully signed in!')).toBeInTheDocument();
      });

      expect(screen.getByText('Redirecting you to the dashboard...')).toBeInTheDocument();
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      expect(mockSetToken).toHaveBeenCalledWith('jwt-token');
    });

    it('calls API with correct token', async () => {
      renderWithToken('my-magic-token');

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/magic-link/verify', {
          token: 'my-magic-token',
        });
      });
    });
  });

  describe('Failed verification', () => {
    it('shows error on invalid response structure', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: false },
      });

      renderWithToken('invalid-token');

      await waitFor(() => {
        expect(screen.getByText('Verification failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Invalid response from server. Please try again.')).toBeInTheDocument();
    });

    it('shows error message from API error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Token has expired'));

      renderWithToken('expired-token');

      await waitFor(() => {
        expect(screen.getByText('Verification failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Token has expired')).toBeInTheDocument();
    });

    it('shows generic error on non-Error rejection', async () => {
      vi.mocked(api.post).mockRejectedValue('Unknown error');

      renderWithToken('bad-token');

      await waitFor(() => {
        expect(screen.getByText('Verification failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Invalid or expired login link. Please request a new one.')).toBeInTheDocument();
    });

    it('has button to request new link on error', async () => {
      const user = userEvent.setup();
      vi.mocked(api.post).mockRejectedValue(new Error('Error'));

      renderWithToken('bad-token');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /request a new login link/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /request a new login link/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Logo', () => {
    it('displays the logo', () => {
      vi.mocked(api.post).mockImplementation(() => new Promise(() => {}));
      renderWithToken('token');

      expect(screen.getByAltText("Annie's Health Journal Logo")).toBeInTheDocument();
    });
  });
});
