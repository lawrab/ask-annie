import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DeleteAccountPage from '../DeleteAccountPage';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    delete: vi.fn(),
  },
}));

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DeleteAccountPage', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up auth store mock with selector support
    const mockState = {
      user: {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        notificationTimes: [],
        notificationsEnabled: true,
        createdAt: '2024-01-01',
      },
      logout: mockLogout,
    };

    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector ? selector(mockState) : mockState
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('should render delete account page', () => {
    render(
      <MemoryRouter>
        <DeleteAccountPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Delete Account')).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    expect(screen.getByText(/deletion confirmation token/i)).toBeInTheDocument();
  });

  it('should show what will be deleted', () => {
    render(
      <MemoryRouter initialEntries={['/account/delete']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/this will permanently delete/i)).toBeInTheDocument();
    expect(screen.getByText(/your account information/i)).toBeInTheDocument();
    expect(screen.getByText(/all check-in records/i)).toBeInTheDocument();
    expect(screen.getByText(/symptom tracking history/i)).toBeInTheDocument();
    expect(screen.getByText(/activity and trigger data/i)).toBeInTheDocument();
  });

  it('should pre-fill token from URL parameter', () => {
    render(
      <MemoryRouter initialEntries={['/account/delete?token=test-token-123']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const tokenInput = screen.getByPlaceholderText(/paste your deletion token/i);
    expect(tokenInput).toHaveValue('test-token-123');
  });

  it('should allow manual token entry', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/account/delete']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const tokenInput = screen.getByPlaceholderText(/paste your deletion token/i);
    await user.type(tokenInput, 'manual-token-456');

    expect(tokenInput).toHaveValue('manual-token-456');
  });

  it('should disable delete button when no token is provided', async () => {
    render(
      <MemoryRouter initialEntries={['/account/delete']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /permanently delete my account/i });
    expect(deleteButton).toBeDisabled();
  });

  it('should successfully delete account with valid token', async () => {
    const user = userEvent.setup();
    vi.mocked(api.delete).mockResolvedValue({
      data: { success: true, message: 'Account deleted' },
    });

    render(
      <MemoryRouter initialEntries={['/account/delete?token=valid-token']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /permanently delete my account/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/user/account', {
        data: { deletionToken: 'valid-token' },
      });
      expect(screen.getByText('Account Deleted')).toBeInTheDocument();
      expect(
        screen.getByText(/your account and all associated data have been permanently deleted/i)
      ).toBeInTheDocument();
    });

    // Wait for the 3 second timeout to trigger logout
    await new Promise((resolve) => setTimeout(resolve, 3100));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  }, 10000); // 10 second timeout for this test

  it('should show error message for invalid token', async () => {
    const user = userEvent.setup();
    vi.mocked(api.delete).mockResolvedValue({
      data: { success: false, error: 'Invalid or expired deletion token' },
    });

    render(
      <MemoryRouter initialEntries={['/account/delete?token=invalid-token']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /permanently delete my account/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired deletion token/i)).toBeInTheDocument();
    });
  });

  it('should show error message for expired token', async () => {
    const user = userEvent.setup();
    vi.mocked(api.delete).mockRejectedValue({
      response: {
        data: { error: 'Deletion token has expired' },
      },
    });

    render(
      <MemoryRouter initialEntries={['/account/delete?token=expired-token']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /permanently delete my account/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/deletion token has expired/i)).toBeInTheDocument();
    });
  });

  it('should show error message for token email mismatch', async () => {
    const user = userEvent.setup();
    vi.mocked(api.delete).mockRejectedValue({
      response: {
        data: { error: 'Token does not match authenticated user' },
      },
    });

    render(
      <MemoryRouter initialEntries={['/account/delete?token=mismatched-token']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /permanently delete my account/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/token does not match authenticated user/i)).toBeInTheDocument();
    });
  });

  it('should navigate to settings when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/account/delete']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    await user.click(cancelButtons[0]); // Click first cancel button (in header)

    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('should navigate to settings when "Return to Settings" is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/account/delete']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const returnLink = screen.getByRole('button', { name: /return to settings/i });
    await user.click(returnLink);

    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('should disable button while deleting', async () => {
    const user = userEvent.setup();
    vi.mocked(api.delete).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 1000))
    );

    render(
      <MemoryRouter initialEntries={['/account/delete?token=test-token']}>
        <Routes>
          <Route path="/account/delete" element={<DeleteAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /permanently delete my account/i });
    await user.click(deleteButton);

    expect(screen.getByRole('button', { name: /deleting account/i })).toBeDisabled();
  });

  // Note: Testing unauthenticated redirect would require a separate test suite
  // with different mock setup. Skipping for now as ProtectedRoute handles this.
});
