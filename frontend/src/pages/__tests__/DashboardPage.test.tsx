import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import DashboardPage from '../DashboardPage';
import { useAuthStore } from '../../stores/authStore';
import { checkInsApi, analysisApi } from '../../services/api';
import type {
  DailyStatusResponse,
  StreakResponse,
  QuickStatsResponse,
  CheckIn,
} from '../../services/api';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the API
vi.mock('../../services/api', () => ({
  checkInsApi: {
    getAll: vi.fn(),
    getStatus: vi.fn(),
  },
  analysisApi: {
    getStreak: vi.fn(),
    getQuickStats: vi.fn(),
  },
}));

// Mock the CheckInCard component
vi.mock('../../components/CheckInCard', () => ({
  CheckInCard: ({ checkIn }: { checkIn: { createdAt: string } }) => (
    <div data-testid="check-in-card">
      CheckInCard - {checkIn.createdAt}
    </div>
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

  // Mock data for Section A: Daily Momentum
  const mockStatusData: DailyStatusResponse = {
    success: true,
    data: {
      today: {
        date: '2024-01-15',
        scheduledTimes: ['08:00', '20:00'],
        completedLogs: [],
        nextSuggested: '20:00',
        isComplete: false,
      },
      stats: {
        todayCount: 0,
        scheduledCount: 2,
      },
    },
  };

  const mockStatusDataComplete: DailyStatusResponse = {
    success: true,
    data: {
      today: {
        date: '2024-01-15',
        scheduledTimes: ['08:00', '20:00'],
        completedLogs: [
          { time: '08:00', checkInId: 'checkin1' },
          { time: '20:00', checkInId: 'checkin2' },
        ],
        nextSuggested: null,
        isComplete: true,
      },
      stats: {
        todayCount: 2,
        scheduledCount: 2,
      },
    },
  };

  const mockStreakData: StreakResponse = {
    success: true,
    data: {
      currentStreak: 45,
      longestStreak: 60,
      activeDays: 120,
      totalDays: 180,
      streakStartDate: '2023-12-01T00:00:00.000Z',
      lastLogDate: '2024-01-15T00:00:00.000Z',
    },
  };

  // Mock data for Section B: Weekly Insights
  const mockQuickStatsData: QuickStatsResponse = {
    success: true,
    data: {
      period: {
        current: {
          start: '2024-01-08',
          end: '2024-01-15',
          days: 7,
        },
        previous: {
          start: '2024-01-01',
          end: '2024-01-07',
          days: 7,
        },
      },
      checkInCount: {
        current: 14,
        previous: 10,
        change: 4,
        percentChange: 40,
      },
      topSymptoms: [
        { name: 'headache', frequency: 8, avgSeverity: 6.5, trend: 'worsening' },
        { name: 'fatigue', frequency: 6, avgSeverity: 5.0, trend: 'stable' },
        { name: 'nausea', frequency: 4, avgSeverity: 3.5, trend: 'improving' },
      ],
      averageSeverity: {
        current: 5.5,
        previous: 6.0,
        change: -0.5,
        trend: 'improving',
      },
    },
  };

  // Mock data with latest check-in
  const mockQuickStatsDataWithLatestCheckIn: QuickStatsResponse = {
    success: true,
    data: {
      period: {
        current: {
          start: '2024-01-08',
          end: '2024-01-15',
          days: 7,
        },
        previous: {
          start: '2024-01-01',
          end: '2024-01-07',
          days: 7,
        },
      },
      checkInCount: {
        current: 14,
        previous: 10,
        change: 4,
        percentChange: 40,
      },
      topSymptoms: [
        { name: 'headache', frequency: 8, avgSeverity: 6.5, trend: 'worsening' },
        { name: 'fatigue', frequency: 6, avgSeverity: 5.0, trend: 'stable' },
        { name: 'nausea', frequency: 4, avgSeverity: 3.5, trend: 'improving' },
      ],
      averageSeverity: {
        current: 5.5,
        previous: 6.0,
        change: -0.5,
        trend: 'improving',
      },
      latestCheckIn: {
        timestamp: new Date('2024-01-15T14:30:00.000Z'),
        symptoms: [
          {
            name: 'headache',
            latestValue: 7,
            averageValue: 5.2,
            trend: 'above' as const,
          },
          {
            name: 'fatigue',
            latestValue: 8,
            averageValue: 6.8,
            trend: 'above' as const,
          },
          {
            name: 'joint pain',
            latestValue: 4,
            averageValue: 4.5,
            trend: 'equal' as const,
          },
        ],
      },
    },
  };

  // Mock data for Section C: Timeline History
  const mockCheckIns: CheckIn[] = [
    {
      _id: '1',
      userId: '123',
      timestamp: new Date().toISOString(), // Today
      rawTranscript: 'I have a headache',
      structured: {
        symptoms: { headache: { severity: 7 } },
        activities: ['working'],
        triggers: ['stress'],
        notes: 'Bad day at work',
      },
      flaggedForDoctor: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      userId: '123',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      structured: {
        symptoms: { fatigue: { severity: 5 } },
        activities: ['resting'],
        triggers: [],
        notes: '',
      },
      flaggedForDoctor: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: '3',
      userId: '123',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      structured: {
        symptoms: { nausea: { severity: 3 } },
        activities: [],
        triggers: [],
        notes: '',
      },
      flaggedForDoctor: false,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = {
        user: mockUser,
        token: 'mock-token',
        isLoading: false,
        isAuthenticated: () => true,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        restoreSession: vi.fn(),
      };
      return selector(state);
    });
  });

  // ============================================================================
  // Header & Navigation Tests
  // ============================================================================

  describe('Header & Navigation', () => {
    it('displays user\'s name in header', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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

      expect(screen.getByText('Annie's Health Journal')).toBeInTheDocument();
      expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
    });

    it('logout button calls logout and navigates to login', async () => {
      const user = userEvent.setup();
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('"New Check-In" button navigates to /checkin', async () => {
      const user = userEvent.setup();
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByText('Timeline')).toBeInTheDocument();
      });

      const newCheckInButton = screen.getByRole('button', { name: /\+ new check-in/i });
      await user.click(newCheckInButton);

      expect(mockNavigate).toHaveBeenCalledWith('/checkin');
    });
  });

  // ============================================================================
  // Section A: Daily Momentum Tests
  // ============================================================================

  describe('Section A: Daily Momentum', () => {
    it('renders check-in CTA when pending (nextSuggested available)', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByText('Daily Momentum')).toBeInTheDocument();
        expect(screen.getByText('Today\'s Check-In')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /evening check-in/i })).toBeInTheDocument();
        expect(screen.getByText(/next suggested: 8:00 PM/i)).toBeInTheDocument();
      });
    });

    it('renders completion alert when isComplete=true', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusDataComplete);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByText('All caught up for today!')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /evening check-in/i })).not.toBeInTheDocument();
    });

    it('displays streak information correctly', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByText('Your Progress')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.getByText('Day Streak')).toBeInTheDocument();
        expect(screen.getByText('120 active days')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching', () => {
      vi.mocked(checkInsApi.getStatus).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(analysisApi.getStreak).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
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

      expect(screen.getByText('Daily Momentum')).toBeInTheDocument();
      const loadingElements = screen.getAllByText('Loading...');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('shows error state on API failure', async () => {
      vi.mocked(checkInsApi.getStatus).mockRejectedValue(new Error('Status failed'));
      vi.mocked(analysisApi.getStreak).mockRejectedValue(new Error('Streak failed'));
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
        expect(screen.getByText('Failed to load daily status and streak data.')).toBeInTheDocument();
      });
    });

    it('navigates to /checkin when button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByRole('button', { name: /evening check-in/i })).toBeInTheDocument();
      });

      const checkInButton = screen.getByRole('button', { name: /evening check-in/i });
      await user.click(checkInButton);

      expect(mockNavigate).toHaveBeenCalledWith('/checkin');
    });
  });

  // ============================================================================
  // Section B: Weekly Insights Tests
  // ============================================================================

  describe('Section B: Weekly Insights', () => {
    it('renders check-in count card with trend indicators', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByText('Weekly Insights')).toBeInTheDocument();
        expect(screen.getByText('Check-ins This Week')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
        expect(screen.getByText(/4 vs last week/i)).toBeInTheDocument();
      });
    });

    it('renders top symptoms card with color-coded badges', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByText('Top Symptoms')).toBeInTheDocument();
        expect(screen.getByText('headache')).toBeInTheDocument();
        expect(screen.getByText('fatigue')).toBeInTheDocument();
        expect(screen.getByText('nausea')).toBeInTheDocument();
      });
    });

    it('renders average severity card with correct color', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByText('Average Severity')).toBeInTheDocument();
        expect(screen.getByText('5.5')).toBeInTheDocument();
        expect(screen.getByText('Improving trend')).toBeInTheDocument();
      });
    });

    it('shows trend icons correctly (⬆️/⬇️/➡️)', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        // Check for trend icons in the document
        const pageText = screen.getByText('Weekly Insights').parentElement?.textContent || '';
        expect(pageText).toContain('⬆️'); // worsening trend for headache
        expect(pageText).toContain('⬇️'); // improving trend for severity/nausea
        expect(pageText).toContain('➡️'); // stable trend for fatigue
      });
    });

    it('shows loading state while fetching', () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Weekly Insights')).toBeInTheDocument();
      const loadingElements = screen.getAllByText('Loading...');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('shows error state on API failure', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockRejectedValue(new Error('Stats failed'));
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
        expect(screen.getByText('Failed to load weekly insights.')).toBeInTheDocument();
      });
    });

    it('shows "No symptoms recorded" when topSymptoms is empty', async () => {
      const emptyStatsData: QuickStatsResponse = {
        ...mockQuickStatsData,
        data: {
          ...mockQuickStatsData.data,
          topSymptoms: [],
        },
      };

      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(emptyStatsData);
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
        expect(screen.getByText('No symptoms recorded')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Latest Check-In Comparison Tests
  // ============================================================================

  describe('Latest Check-In Comparison Section', () => {
    it('does not display section when latestCheckIn is not present', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByText('Weekly Insights')).toBeInTheDocument();
      });

      expect(screen.queryByText('Latest Check-In vs. Your Averages')).not.toBeInTheDocument();
    });

    it('displays section when latestCheckIn data exists', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsDataWithLatestCheckIn);
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
        expect(screen.getByText('Latest Check-In vs. Your Averages')).toBeInTheDocument();
      });
    });

    it('displays all symptoms with capitalized names', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsDataWithLatestCheckIn);
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
        expect(screen.getByText('Headache')).toBeInTheDocument();
        expect(screen.getByText('Fatigue')).toBeInTheDocument();
        expect(screen.getByText('Joint pain')).toBeInTheDocument();
      });
    });

    it('displays current and average values correctly', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsDataWithLatestCheckIn);
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
        expect(screen.getByText('Latest Check-In vs. Your Averages')).toBeInTheDocument();
      });

      // Verify all "Current:" labels are present
      const currentLabels = screen.getAllByText('Current:');
      expect(currentLabels).toHaveLength(3); // One for each symptom

      // Verify all "Avg:" labels are present
      const avgLabels = screen.getAllByText('Avg:');
      expect(avgLabels).toHaveLength(3); // One for each symptom

      // Verify the specific values using text content matching
      expect(screen.getByText((_content, element) => {
        return element?.textContent === 'Avg: 5.2';
      })).toBeInTheDocument();

      expect(screen.getByText((_content, element) => {
        return element?.textContent === 'Avg: 6.8';
      })).toBeInTheDocument();

      expect(screen.getByText((_content, element) => {
        return element?.textContent === 'Avg: 4.5';
      })).toBeInTheDocument();
    });

    it('displays "Above usual" indicator for above trend', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsDataWithLatestCheckIn);
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
        const aboveUsualElements = screen.getAllByText('Above usual');
        expect(aboveUsualElements).toHaveLength(2); // headache and fatigue
      });
    });

    it('displays "Normal" indicator for equal trend', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsDataWithLatestCheckIn);
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
        expect(screen.getByText('Normal')).toBeInTheDocument(); // joint pain
      });
    });

    it('displays "Below usual" indicator for below trend', async () => {
      const statsWithBelowTrend: QuickStatsResponse = {
        ...mockQuickStatsDataWithLatestCheckIn,
        data: {
          ...mockQuickStatsDataWithLatestCheckIn.data,
          latestCheckIn: {
            timestamp: new Date('2024-01-15T14:30:00.000Z'),
            symptoms: [
              {
                name: 'nausea',
                latestValue: 2,
                averageValue: 5.5,
                trend: 'below' as const,
              },
            ],
          },
        },
      };

      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(statsWithBelowTrend);
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
        expect(screen.getByText('Below usual')).toBeInTheDocument();
      });
    });

    it('uses correct color classes for trend indicators', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsDataWithLatestCheckIn);
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
        expect(screen.getByText('Latest Check-In vs. Your Averages')).toBeInTheDocument();
      });

      // Check that trend indicators have proper color classes
      const aboveElements = screen.getAllByText('Above usual');
      aboveElements.forEach((element) => {
        expect(element.parentElement).toHaveClass('text-red-600');
      });

      const normalElement = screen.getByText('Normal');
      expect(normalElement.parentElement).toHaveClass('text-gray-600');
    });

    it('displays indicators with aria-hidden for screen readers', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsDataWithLatestCheckIn);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      const { container } = render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Latest Check-In vs. Your Averages')).toBeInTheDocument();
      });

      // Check for aria-hidden attribute on indicator symbols
      const indicators = container.querySelectorAll('[aria-hidden="true"]');
      expect(indicators.length).toBeGreaterThan(0);
    });

    it('does not display section when statsData is loading', () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      expect(screen.queryByText('Latest Check-In vs. Your Averages')).not.toBeInTheDocument();
    });

    it('does not display section when stats API fails', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockRejectedValue(new Error('Stats failed'));
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
        expect(screen.getByText('Failed to load weekly insights.')).toBeInTheDocument();
      });

      expect(screen.queryByText('Latest Check-In vs. Your Averages')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Section C: Timeline History Tests
  // ============================================================================

  describe('Section C: Timeline History', () => {
    it('renders CheckInCard components', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const checkInCards = screen.getAllByTestId('check-in-card');
        expect(checkInCards).toHaveLength(3);
      });
    });

    it('groups check-ins by date correctly', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Timeline')).toBeInTheDocument();
        // Check that date groupings are present
        const checkInCards = screen.getAllByTestId('check-in-card');
        expect(checkInCards.length).toBeGreaterThan(0);
      });
    });

    it('shows "Today", "Yesterday", formatted dates', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/^Today$/i)).toBeInTheDocument();
        expect(screen.getByText(/^Yesterday$/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no check-ins', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByText('No check-ins yet')).toBeInTheDocument();
        expect(screen.getByText('Get started by recording your first check-in.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create your first check-in/i })).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching', () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Loading check-ins...')).toBeInTheDocument();
    });

    it('shows error state on API failure', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockRejectedValue(new Error('CheckIns failed'));

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load check-ins.')).toBeInTheDocument();
      });
    });

    it('navigates to /checkin from empty state button', async () => {
      const user = userEvent.setup();
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
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
        expect(screen.getByText('No check-ins yet')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create your first check-in/i });
      await user.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/checkin');
    });
  });

  // ============================================================================
  // Independent Error Handling Tests
  // ============================================================================

  describe('Independent Error Handling', () => {
    it('Section A error does not block Section B', async () => {
      vi.mocked(checkInsApi.getStatus).mockRejectedValue(new Error('Status failed'));
      vi.mocked(analysisApi.getStreak).mockRejectedValue(new Error('Streak failed'));
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
        // Section A shows error
        expect(screen.getByText('Failed to load daily status and streak data.')).toBeInTheDocument();
        // Section B still renders successfully
        expect(screen.getByText('Weekly Insights')).toBeInTheDocument();
        expect(screen.getByText('Check-ins This Week')).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
      });
    });

    it('Section B error does not block Section C', async () => {
      vi.mocked(checkInsApi.getStatus).mockResolvedValue(mockStatusData);
      vi.mocked(analysisApi.getStreak).mockResolvedValue(mockStreakData);
      vi.mocked(analysisApi.getQuickStats).mockRejectedValue(new Error('Stats failed'));
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Section B shows error
        expect(screen.getByText('Failed to load weekly insights.')).toBeInTheDocument();
        // Section C still renders successfully
        expect(screen.getByText('Timeline')).toBeInTheDocument();
        const checkInCards = screen.getAllByTestId('check-in-card');
        expect(checkInCards).toHaveLength(3);
      });
    });

    it('multiple sections can error independently', async () => {
      vi.mocked(checkInsApi.getStatus).mockRejectedValue(new Error('Status failed'));
      vi.mocked(analysisApi.getStreak).mockRejectedValue(new Error('Streak failed'));
      vi.mocked(analysisApi.getQuickStats).mockRejectedValue(new Error('Stats failed'));
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Sections A and B show errors
        expect(screen.getByText('Failed to load daily status and streak data.')).toBeInTheDocument();
        expect(screen.getByText('Failed to load weekly insights.')).toBeInTheDocument();
        // Section C still renders successfully
        expect(screen.getByText('Timeline')).toBeInTheDocument();
        const checkInCards = screen.getAllByTestId('check-in-card');
        expect(checkInCards).toHaveLength(3);
      });
    });

    it('all sections can fail without crashing', async () => {
      vi.mocked(checkInsApi.getStatus).mockRejectedValue(new Error('Status failed'));
      vi.mocked(analysisApi.getStreak).mockRejectedValue(new Error('Streak failed'));
      vi.mocked(analysisApi.getQuickStats).mockRejectedValue(new Error('Stats failed'));
      vi.mocked(checkInsApi.getAll).mockRejectedValue(new Error('CheckIns failed'));

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // All sections show errors
        expect(screen.getByText('Failed to load daily status and streak data.')).toBeInTheDocument();
        expect(screen.getByText('Failed to load weekly insights.')).toBeInTheDocument();
        expect(screen.getByText('Failed to load check-ins.')).toBeInTheDocument();
        // Page still renders
        expect(screen.getByText('Annie's Health Journal')).toBeInTheDocument();
      });
    });

    it('Section A error does not block Section C', async () => {
      vi.mocked(checkInsApi.getStatus).mockRejectedValue(new Error('Status failed'));
      vi.mocked(analysisApi.getStreak).mockRejectedValue(new Error('Streak failed'));
      vi.mocked(analysisApi.getQuickStats).mockResolvedValue(mockQuickStatsData);
      vi.mocked(checkInsApi.getAll).mockResolvedValue({
        success: true,
        data: { checkIns: mockCheckIns, pagination: { total: 3, limit: 20, offset: 0, hasMore: false } },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Section A shows error
        expect(screen.getByText('Failed to load daily status and streak data.')).toBeInTheDocument();
        // Section C still renders successfully
        expect(screen.getByText('Timeline')).toBeInTheDocument();
        const checkInCards = screen.getAllByTestId('check-in-card');
        expect(checkInCards).toHaveLength(3);
      });
    });
  });
});
