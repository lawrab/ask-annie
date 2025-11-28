import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import TrendsPage from '../TrendsPage';
import { useAuthStore } from '../../stores/authStore';
import { analysisApi } from '../../services/api';
import type {
  SymptomsAnalysisResponse,
  SymptomTrendResponse,
} from '../../services/api';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the API
vi.mock('../../services/api', () => ({
  analysisApi: {
    getSymptomsAnalysis: vi.fn(),
    getSymptomTrend: vi.fn(),
  },
}));

// Mock the SymptomChart component
vi.mock('../../components/charts/SymptomChart', () => ({
  SymptomChart: ({ onDateClick }: { onDateClick?: (date: string) => void }) => (
    <div data-testid="symptom-chart" onClick={() => onDateClick?.('2025-01-15')}>
      SymptomChart
    </div>
  ),
}));

// Mock the QuickStatsCard component
vi.mock('../../components/dashboard/QuickStatsCard', () => ({
  QuickStatsCard: ({ label, current, previous }: { label: string; current: number; previous: number }) => (
    <div data-testid="quick-stats-card">
      {label}: {current} (prev: {previous})
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

describe('TrendsPage', () => {
  const mockLogout = vi.fn();
  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    notificationTimes: ['08:00'],
    notificationsEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const mockSymptomsData: SymptomsAnalysisResponse = {
    success: true,
    data: [
      { name: 'Headache', count: 10, averageSeverity: 6.5 },
      { name: 'Fatigue', count: 8, averageSeverity: 5.0 },
      { name: 'Nausea', count: 5, averageSeverity: 4.2 },
    ],
  };

  const mockTrendData: SymptomTrendResponse = {
    success: true,
    data: {
      symptom: 'Headache',
      dateRange: {
        start: '2025-01-08',
        end: '2025-01-14',
      },
      dataPoints: [
        { date: '2025-01-08', value: 7 },
        { date: '2025-01-09', value: 6 },
        { date: '2025-01-10', value: 5 },
        { date: '2025-01-11', value: 6 },
        { date: '2025-01-12', value: 5 },
        { date: '2025-01-13', value: 4 },
        { date: '2025-01-14', value: 3 },
      ],
      statistics: {
        average: 5.14,
        min: 3,
        max: 7,
        median: 5.0,
        standardDeviation: 1.35,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      const state = {
        user: mockUser,
        token: 'mock-token',
        isLoading: false,
        isAuthenticated: () => true,
        setUser: vi.fn(),
        setToken: vi.fn(),
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        restoreSession: vi.fn(),
      };
      return selector(state);
    });
  });

  describe('Page rendering', () => {
    it('renders page title and description', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Symptom Trends')).toBeInTheDocument();
        expect(screen.getByText(/analyze your symptom patterns over time/i)).toBeInTheDocument();
      });
    });

    it('displays user name in header', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Annie's Health Journal")).toBeInTheDocument();
        expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
      });
    });
  });

  describe('Data fetching', () => {
    it('fetches symptoms list on mount', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(analysisApi.getSymptomsAnalysis).toHaveBeenCalledTimes(1);
      });
    });

    it('fetches trend data when symptom selected', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(analysisApi.getSymptomTrend).toHaveBeenCalledWith('Headache', 7);
      });
    });

    it('auto-selects first symptom from list', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const select = screen.getByLabelText('Symptom') as HTMLSelectElement;
        expect(select.value).toBe('Headache');
      });
    });

    it('updates chart when symptom changes', async () => {
      const user = userEvent.setup();
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Symptom')).toBeInTheDocument();
      });

      const select = screen.getByLabelText('Symptom');
      await user.selectOptions(select, 'Fatigue');

      await waitFor(() => {
        expect(analysisApi.getSymptomTrend).toHaveBeenCalledWith('Fatigue', 7);
      });
    });

    it('updates chart when time range changes', async () => {
      const user = userEvent.setup();
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Time Range')).toBeInTheDocument();
      });

      const select = screen.getByLabelText('Time Range');
      await user.selectOptions(select, '30');

      await waitFor(() => {
        expect(analysisApi.getSymptomTrend).toHaveBeenCalledWith('Headache', 30);
      });
    });
  });

  describe('Loading states', () => {
    it('shows loading spinner while fetching symptoms', () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Loading symptoms...')).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows loading spinner while fetching trend data', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Loading trend data...')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('shows error message on symptoms API failure', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockRejectedValue(new Error('API Error'));

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load symptoms list.')).toBeInTheDocument();
      });
    });

    it('shows error message on trend API failure', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockRejectedValue(new Error('API Error'));

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load trend data.')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no symptoms available', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue({
        success: true,
        data: [],
      });

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No symptoms tracked yet')).toBeInTheDocument();
        expect(screen.getByText(/start recording check-ins/i)).toBeInTheDocument();
      });
    });

    it('shows create check-in button in empty state', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue({
        success: true,
        data: [],
      });

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create your first check-in/i })).toBeInTheDocument();
      });
    });

    it('navigates to check-in page from empty state', async () => {
      const user = userEvent.setup();
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue({
        success: true,
        data: [],
      });

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create your first check-in/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /create your first check-in/i });
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/checkin');
    });
  });

  describe('Symptom selector', () => {
    it('displays all symptoms in dropdown', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Headache \(avg: 6.5\)/)).toBeInTheDocument();
        expect(screen.getByText(/Fatigue \(avg: 5.0\)/)).toBeInTheDocument();
        expect(screen.getByText(/Nausea \(avg: 4.2\)/)).toBeInTheDocument();
      });
    });

    it('has accessible label for symptom selector', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const label = screen.getByLabelText('Symptom');
        expect(label).toBeInTheDocument();
      });
    });
  });

  describe('Time range selector', () => {
    it('displays all time range options', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Last 7 days')).toBeInTheDocument();
        expect(screen.getByText('Last 14 days')).toBeInTheDocument();
        expect(screen.getByText('Last 30 days')).toBeInTheDocument();
        expect(screen.getByText('Last 90 days')).toBeInTheDocument();
      });
    });

    it('defaults to 7 days', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const select = screen.getByLabelText('Time Range') as HTMLSelectElement;
        expect(select.value).toBe('7');
      });
    });

    it('has accessible label for time range selector', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const label = screen.getByLabelText('Time Range');
        expect(label).toBeInTheDocument();
      });
    });
  });

  describe('Chart rendering', () => {
    it('renders SymptomChart when data available', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('symptom-chart')).toBeInTheDocument();
      });
    });

    it('displays chart title with symptom name', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Headache - Severity Over Time')).toBeInTheDocument();
      });
    });

    it('logs date click to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const user = userEvent.setup();
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('symptom-chart')).toBeInTheDocument();
      });

      const chart = screen.getByTestId('symptom-chart');
      await user.click(chart);

      expect(consoleSpy).toHaveBeenCalledWith('Clicked date:', '2025-01-15');
      consoleSpy.mockRestore();
    });
  });

  describe('Statistics cards', () => {
    it('displays average severity card', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Average Severity: 5.14/)).toBeInTheDocument();
      });
    });

    it('displays severity range card', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Severity Range')).toBeInTheDocument();
        expect(screen.getByText('3 - 7')).toBeInTheDocument();
      });
    });

    it('calculates days present correctly', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Days Present')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument(); // 7 of 7 days
        expect(screen.getByText('7 of 7 days')).toBeInTheDocument();
      });
    });

    it('calculates partial days present correctly', async () => {
      const partialTrendData: SymptomTrendResponse = {
        ...mockTrendData,
        data: {
          ...mockTrendData.data,
          dataPoints: mockTrendData.data.dataPoints.slice(0, 3), // 3 of 7 days
        },
      };
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(partialTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('43%')).toBeInTheDocument(); // 3/7 = 42.86% rounded to 43%
        expect(screen.getByText('3 of 7 days')).toBeInTheDocument();
      });
    });
  });

  describe('Trend direction', () => {
    it('determines improving trend correctly', async () => {
      const improvingData: SymptomTrendResponse = {
        ...mockTrendData,
        data: {
          ...mockTrendData.data,
          dataPoints: [
            { date: '2025-01-08', value: 8 },
            { date: '2025-01-09', value: 7 },
            { date: '2025-01-10', value: 6 },
            { date: '2025-01-11', value: 5 },
            { date: '2025-01-12', value: 4 },
            { date: '2025-01-13', value: 3 },
          ],
        },
      };
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(improvingData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('⬇️ Improving')).toBeInTheDocument();
      });
    });

    it('determines worsening trend correctly', async () => {
      const worseningData: SymptomTrendResponse = {
        ...mockTrendData,
        data: {
          ...mockTrendData.data,
          dataPoints: [
            { date: '2025-01-08', value: 3 },
            { date: '2025-01-09', value: 4 },
            { date: '2025-01-10', value: 5 },
            { date: '2025-01-11', value: 6 },
            { date: '2025-01-12', value: 7 },
            { date: '2025-01-13', value: 8 },
          ],
        },
      };
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(worseningData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('⬆️ Worsening')).toBeInTheDocument();
      });
    });

    it('determines stable trend correctly', async () => {
      const stableData: SymptomTrendResponse = {
        ...mockTrendData,
        data: {
          ...mockTrendData.data,
          dataPoints: [
            { date: '2025-01-08', value: 5 },
            { date: '2025-01-09', value: 5 },
            { date: '2025-01-10', value: 5 },
            { date: '2025-01-11', value: 5 },
            { date: '2025-01-12', value: 5 },
            { date: '2025-01-13', value: 5 },
          ],
        },
      };
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(stableData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('➡️ Stable')).toBeInTheDocument();
      });
    });

    it('uses threshold of 0.5 for trend detection', async () => {
      const borderlineData: SymptomTrendResponse = {
        ...mockTrendData,
        data: {
          ...mockTrendData.data,
          dataPoints: [
            { date: '2025-01-08', value: 5.0 },
            { date: '2025-01-09', value: 5.1 },
            { date: '2025-01-10', value: 5.2 },
            { date: '2025-01-11', value: 5.3 },
          ],
        },
      };
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(borderlineData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('➡️ Stable')).toBeInTheDocument();
      });
    });

    it('handles single data point as stable', async () => {
      const singlePointData: SymptomTrendResponse = {
        ...mockTrendData,
        data: {
          ...mockTrendData.data,
          dataPoints: [{ date: '2025-01-08', value: 5 }],
        },
      };
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(singlePointData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('➡️ Stable')).toBeInTheDocument();
      });
    });

    it('applies correct color for improving trend', async () => {
      const improvingData: SymptomTrendResponse = {
        ...mockTrendData,
        data: {
          ...mockTrendData.data,
          dataPoints: [
            { date: '2025-01-08', value: 8 },
            { date: '2025-01-09', value: 3 },
          ],
        },
      };
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(improvingData);

      const { container } = render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const trendElement = container.querySelector('.text-green-600');
        expect(trendElement).toBeInTheDocument();
      });
    });

    it('applies correct color for worsening trend', async () => {
      const worseningData: SymptomTrendResponse = {
        ...mockTrendData,
        data: {
          ...mockTrendData.data,
          dataPoints: [
            { date: '2025-01-08', value: 3 },
            { date: '2025-01-09', value: 8 },
          ],
        },
      };
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(worseningData);

      const { container } = render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const trendElement = container.querySelector('.text-red-600');
        expect(trendElement).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to dashboard when Dashboard button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
      });

      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      await user.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('logout button calls logout and navigates to login', async () => {
      const user = userEvent.setup();
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Authentication', () => {
    it('requires authenticated user', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('handles zero data points gracefully', async () => {
      const emptyTrendData: SymptomTrendResponse = {
        ...mockTrendData,
        data: {
          ...mockTrendData.data,
          dataPoints: [],
        },
      };
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(mockSymptomsData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(emptyTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('symptom-chart')).toBeInTheDocument();
      });
    });

    it('handles API returning success: false', async () => {
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue({
        success: false,
        data: [],
      } as SymptomsAnalysisResponse);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No symptoms tracked yet')).toBeInTheDocument();
      });
    });

    it('handles very long symptom names', async () => {
      const longSymptomData: SymptomsAnalysisResponse = {
        success: true,
        data: [
          { name: 'Very Long Symptom Name That Should Still Display Correctly', count: 10, averageSeverity: 6.5 },
        ],
      };
      vi.mocked(analysisApi.getSymptomsAnalysis).mockResolvedValue(longSymptomData);
      vi.mocked(analysisApi.getSymptomTrend).mockResolvedValue(mockTrendData);

      render(
        <MemoryRouter>
          <TrendsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Very Long Symptom Name/)).toBeInTheDocument();
      });
    });
  });
});
