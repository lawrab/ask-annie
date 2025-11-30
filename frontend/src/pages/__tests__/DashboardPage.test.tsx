import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import DashboardPage from '../DashboardPage';
import { useAuthStore } from '../../stores/authStore';
import { checkInsApi, analysisApi } from '../../services/api';
import type { QuickStatsResponse, CheckIn } from '../../services/api';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the API
vi.mock('../../services/api', () => ({
  checkInsApi: {
    getAll: vi.fn(),
  },
  analysisApi: {
    getQuickStats: vi.fn(),
  },
}));

// Mock the CheckInCard component
vi.mock('../../components/CheckInCard', () => ({
  CheckInCard: ({ checkIn }: { checkIn: { _id: string } }) => (
    <div data-testid="check-in-card">CheckInCard - {checkIn._id}</div>
  ),
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

  const mockQuickStatsData: QuickStatsResponse = {
    success: true,
    data: {
      period: {
        current: { start: '2024-01-08', end: '2024-01-15', days: 7 },
        previous: { start: '2024-01-01', end: '2024-01-08', days: 7 },
      },
      checkInCount: { current: 5, previous: 3, change: 2, percentChange: 66.67 },
      topSymptoms: [
        { name: 'fatigue', frequency: 5, avgSeverity: 6.5, trend: 'stable' as const },
        { name: 'headache', frequency: 3, avgSeverity: 4.2, trend: 'improving' as const },
      ],
      averageSeverity: { current: 5.3, previous: 6.0, change: -0.7, trend: 'improving' as const },
    },
  };

  const mockCheckIns: CheckIn[] = [
    {
      _id: 'checkin1',
      userId: '123',
      timestamp: new Date().toISOString(),
      rawTranscript: 'Feeling tired today',
      structured: {
        symptoms: { fatigue: { severity: 6 } },
        activities: [],
        triggers: [],
        notes: 'Tired',
      },
      flaggedForDoctor: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'checkin2',
      userId: '123',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      rawTranscript: 'Headache',
      structured: {
        symptoms: { headache: { severity: 4 } },
        activities: [],
        triggers: [],
        notes: 'Mild headache',
      },
      flaggedForDoctor: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Default auth store mock
    const mockState = {
      user: mockUser,
      logout: mockLogout,
    };
    vi.mocked(useAuthStore).mockImplementation((selector: unknown) =>
      typeof selector === 'function'
        ? (selector as (state: typeof mockState) => unknown)(mockState)
        : mockState
    );
  });

  // ============================================================================
  // Loading State Tests
  // ============================================================================
  describe('Loading States', () => {
    it('shows loading indicators while fetching data', async () => {
      vi.mocked(analysisApi.getQuickStats).mockImplementation(
        () => new Promise(() => {})
      );
      vi.mocked(checkInsApi.getAll).mockImplementation(() => new Promise(() => {}));

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/loading your health summary/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Health Summary Tests
  // ============================================================================
  describe('Health Summary', () => {
    it('displays health summary with score and trend', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 2, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('How are you doing?')).toBeInTheDocument();
      });

      // Check severity score
      expect(screen.getByText('5.3')).toBeInTheDocument();
      expect(screen.getByText('out of 10')).toBeInTheDocument();

      // Check trend
      expect(screen.getByText('Getting better')).toBeInTheDocument();
    });

    it('displays top symptoms', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 2, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/fatigue/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/headache/i)).toBeInTheDocument();
    });

    it('shows error message on API failure', async () => {
      vi.mocked(analysisApi.getQuickStats).mockRejectedValue(new Error('API Error'));
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load health summary/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Check-In CTA Tests
  // ============================================================================
  describe('Check-In CTA', () => {
    it('displays check-in button', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 2, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /check in now/i })).toBeInTheDocument();
      });
    });

    it('navigates to check-in page when button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 2, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /check in now/i })).toBeInTheDocument();
      });

      const checkInButton = screen.getByRole('button', { name: /check in now/i });
      await user.click(checkInButton);

      expect(mockNavigate).toHaveBeenCalledWith('/checkin');
    });

    it('shows last check-in time', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 2, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/last check-in:/i)).toBeInTheDocument();
      });
    });

    it('shows "No check-ins yet" when no check-ins exist', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Text appears in both CheckInCTA and RecentCheckIns
        expect(screen.getAllByText(/no check-ins yet/i).length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // Recent Check-ins Tests
  // ============================================================================
  describe('Recent Check-ins', () => {
    it('displays recent check-ins section', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 2, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Recent Check-ins')).toBeInTheDocument();
      });

      // Check that check-in cards are rendered
      expect(screen.getAllByTestId('check-in-card')).toHaveLength(2);
    });

    it('shows empty state when no check-ins', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/your check-in history will appear here/i)).toBeInTheDocument();
      });
    });

    it('shows error message on check-ins API failure', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockRejectedValue(new Error('API Error'));

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load check-ins/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Header / Navigation Tests
  // ============================================================================
  describe('Header and Navigation', () => {
    it('displays header with app title', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText("Annie's Health Journal")).toBeInTheDocument();
    });

    it('displays welcome message with username', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/welcome, testuser/i)).toBeInTheDocument();
    });

    it('displays Trends navigation button', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /trends/i })).toBeInTheDocument();
    });

    it('navigates to trends page when Trends button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      const trendsButton = screen.getByRole('button', { name: /trends/i });
      await user.click(trendsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trends');
    });

    it('displays profile dropdown with user initial', async () => {
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      // User initial 'T' for 'testuser'
      expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
    });

    it('opens profile dropdown and shows settings option', async () => {
      const user = userEvent.setup();
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      const profileButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('navigates to settings when settings option is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      const profileButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const settingsButton = screen.getByText('Settings');
      await user.click(settingsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });

    it('logs out when logout option is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      const profileButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
