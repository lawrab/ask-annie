import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import RegisterPage from '../RegisterPage';
import api from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email entry form', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/get started with annie/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByText(/no password needed/i)).toBeInTheDocument();
  });

  it('should have link to login page', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should proceed to username step for new user', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, exists: false } });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email address'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/choose your username/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });
  });

  it('should send login link directly for existing user', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, exists: true } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email address'), 'existing@example.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/magic-link/request', {
        email: 'existing@example.com',
      });
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short username', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, exists: false } });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    // First step - email
    await user.type(screen.getByLabelText('Email address'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Second step - username
    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText('Username');
    await user.type(usernameInput, 'ab');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for long username', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, exists: false } });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    // First step - email
    await user.type(screen.getByLabelText('Email address'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Second step - username
    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText('Username');
    await user.type(usernameInput, 'a'.repeat(31));
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/username must be at most 30 characters/i)).toBeInTheDocument();
    });
  });

  it('should allow going back to email step from username step', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, exists: false } });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    // Go to username step
    await user.type(screen.getByLabelText('Email address'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByRole('button', { name: /back to email/i });
    await user.click(backButton);

    // Should be back on email step
    await waitFor(() => {
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });
  });

  it('should complete registration for new user', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, exists: false } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    // Step 1: Email
    await user.type(screen.getByLabelText('Email address'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2: Username
    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Username'), 'newuser');
    await user.click(screen.getByRole('button', { name: /create account & send login link/i }));

    // Step 3: Success screen
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/magic-link/request', {
        email: 'new@example.com',
        username: 'newuser',
      });
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(/login link sent/i)).toBeInTheDocument();
    });
  });

  it('should show error message on API failure', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true, exists: false } }), 100))
    );

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /continue/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    // After loading, should proceed to next step
    await waitFor(() => {
      expect(screen.getByText(/choose your username/i)).toBeInTheDocument();
    });
  });
});
