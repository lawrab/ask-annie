import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import DashboardPage from '../DashboardPage';
import { useAuthStore } from '../../stores/authStore';
import * as api from '../../services/api';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the API
vi.mock('../../services/api', () => ({
  checkInsApi: {
    getAll: vi.fn(),
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

describe('DashboardPage', () => {
  const mockLogout = vi.fn();
  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    notificationTimes: ['08:00'],
    notificationsEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = {
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: () => true,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        restoreSession: vi.fn(),
      };
      return selector(state);
    });
  });

  it('should render dashboard with user welcome message', async () => {
    vi.mocked(api.checkInsApi.getAll).mockResolvedValue({
      success: true,
      data: {
        checkIns: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
      },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Ask Annie')).toBeInTheDocument();
    expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    vi.mocked(api.checkInsApi.getAll).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading check-ins...')).toBeInTheDocument();
  });

  it('should show empty state when no check-ins', async () => {
    vi.mocked(api.checkInsApi.getAll).mockResolvedValue({
      success: true,
      data: {
        checkIns: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
      },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No check-ins yet')).toBeInTheDocument();
      expect(
        screen.getByText('Get started by recording your first check-in.')
      ).toBeInTheDocument();
    });
  });

  it('should display check-ins list', async () => {
    const mockCheckIns = [
      {
        _id: '1',
        userId: '123',
        timestamp: '2024-01-01T12:00:00.000Z',
        rawTranscript: 'I have a headache',
        structured: {
          symptoms: { headache: { severity: 7 } },
          activities: ['working'],
          triggers: ['stress'],
          notes: 'Bad day at work',
        },
        flaggedForDoctor: false,
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      },
    ];

    vi.mocked(api.checkInsApi.getAll).mockResolvedValue({
      success: true,
      data: {
        checkIns: mockCheckIns,
        pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
      },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/I have a headache/i)).toBeInTheDocument();
      expect(screen.getByText('headache: 7')).toBeInTheDocument();
      expect(screen.getByText('working')).toBeInTheDocument();
      expect(screen.getByText('stress')).toBeInTheDocument();
      expect(screen.getByText('Bad day at work')).toBeInTheDocument();
    });
  });

  it('should show flagged indicator for flagged check-ins', async () => {
    const mockCheckIns = [
      {
        _id: '1',
        userId: '123',
        timestamp: '2024-01-01T12:00:00.000Z',
        structured: {
          symptoms: { pain: { severity: 9 } },
          activities: [],
          triggers: [],
          notes: '',
        },
        flaggedForDoctor: true,
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      },
    ];

    vi.mocked(api.checkInsApi.getAll).mockResolvedValue({
      success: true,
      data: {
        checkIns: mockCheckIns,
        pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
      },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Flagged for Doctor')).toBeInTheDocument();
    });
  });

  it('should show error message on API failure', async () => {
    vi.mocked(api.checkInsApi.getAll).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load check-ins. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('should navigate to checkin page when clicking new check-in button', async () => {
    const user = userEvent.setup();
    vi.mocked(api.checkInsApi.getAll).mockResolvedValue({
      success: true,
      data: {
        checkIns: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
      },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No check-ins yet')).toBeInTheDocument();
    });

    const newCheckInButton = screen.getByRole('button', { name: /new check-in/i });
    await user.click(newCheckInButton);

    expect(mockNavigate).toHaveBeenCalledWith('/checkin');
  });

  it('should navigate to checkin page from empty state', async () => {
    const user = userEvent.setup();
    vi.mocked(api.checkInsApi.getAll).mockResolvedValue({
      success: true,
      data: {
        checkIns: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
      },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No check-ins yet')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', {
      name: /create your first check-in/i,
    });
    await user.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/checkin');
  });

  it('should call logout and navigate to login when logout button clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(api.checkInsApi.getAll).mockResolvedValue({
      success: true,
      data: {
        checkIns: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
      },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should format date correctly', async () => {
    const mockCheckIns = [
      {
        _id: '1',
        userId: '123',
        timestamp: '2024-06-15T14:30:00.000Z',
        structured: {
          symptoms: { headache: { severity: 5 } },
          activities: [],
          triggers: [],
          notes: '',
        },
        flaggedForDoctor: false,
        createdAt: '2024-06-15T14:30:00.000Z',
        updatedAt: '2024-06-15T14:30:00.000Z',
      },
    ];

    vi.mocked(api.checkInsApi.getAll).mockResolvedValue({
      success: true,
      data: {
        checkIns: mockCheckIns,
        pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
      },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Date formatting may vary by locale, just check it renders
      expect(screen.getByText(/Jun 15, 2024/i)).toBeInTheDocument();
    });
  });
});
