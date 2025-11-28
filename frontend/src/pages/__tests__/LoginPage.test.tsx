import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import LoginPage from '../LoginPage';
import api from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render magic link request form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Sign in to Annie's Health Journal")).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
    expect(screen.getByText(/no password needed/i)).toBeInTheDocument();
  });

  it('should have link to register page', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const registerLink = screen.getByRole('link', { name: /sign up/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should send magic link request on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/magic-link/request', {
        email: 'test@example.com',
      });
    });
  });

  it('should show email sent confirmation after successful request', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/expire in 15 minutes/i)).toBeInTheDocument();
    });
  });

  it('should show error message on failed request', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue(new Error('Rate limit exceeded'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
  });

  it('should show generic error message on non-Error failure', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue('Something went wrong');

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Failed to send magic link. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 100))
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email address'), 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/sending\.\.\./i)).toBeInTheDocument();

    // After submission, should show email sent screen
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('should allow retrying from email sent screen', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // First submission
    await user.type(screen.getByLabelText('Email address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    // Click "Try again" button
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    await user.click(tryAgainButton);

    // Should go back to form
    await waitFor(() => {
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
    });
  });

  it('should not submit form with validation errors', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(api.post).not.toHaveBeenCalled();
    });
  });
});
