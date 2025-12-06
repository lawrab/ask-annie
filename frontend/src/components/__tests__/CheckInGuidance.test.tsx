import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CheckInGuidance from '../CheckInGuidance';
import { checkInsApi, CheckInContext } from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  checkInsApi: {
    getContext: vi.fn(),
  },
}));

describe('CheckInGuidance', () => {
  const mockGetContext = checkInsApi.getContext as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const contextWithHistory: CheckInContext = {
    lastCheckIn: {
      timestamp: '2024-01-15T10:00:00.000Z',
      timeAgo: '12 hours ago',
      symptoms: [
        { name: 'Headache', severity: 7 },
        { name: 'Fatigue', severity: 5 },
        { name: 'Nausea', severity: 3 },
      ],
    },
    recentSymptoms: [
      { name: 'Headache', frequency: 5, avgSeverity: 6.5, trend: 'improving' as const },
      { name: 'Fatigue', frequency: 3, avgSeverity: 4.2, trend: 'stable' as const },
      { name: 'Back Pain', frequency: 2, avgSeverity: 7.0, trend: 'worsening' as const },
    ],
    streak: {
      current: 5,
      message: '5-day streak! Keep it going!',
    },
    suggestedTopics: ['Rate symptoms 1-10', 'Activities today', 'Any triggers'],
  };

  const contextNewUser: CheckInContext = {
    recentSymptoms: [],
    streak: {
      current: 0,
    },
    suggestedTopics: ['Rate symptoms 1-10', "How you're feeling", 'Activities', 'Triggers'],
  };

  describe('Loading State', () => {
    it('should show loading skeleton while fetching context', async () => {
      mockGetContext.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: contextWithHistory }), 100))
      );

      render(<CheckInGuidance />);

      // Should show loading skeleton
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('With User History', () => {
    beforeEach(() => {
      mockGetContext.mockResolvedValue({ success: true, data: contextWithHistory });
    });

    it('should render the guidance header', async () => {
      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText('Your Check-In Guide')).toBeInTheDocument();
      });
    });

    it('should display last check-in context with symptoms', async () => {
      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText('Last check-in')).toBeInTheDocument();
        expect(screen.getByText('(12 hours ago):')).toBeInTheDocument();
      });

      // Check symptom chips with severity (multiple "Headache" appear due to last check-in and recent)
      // Just verify the severity values from last check-in are present
      expect(screen.getByText('7/10')).toBeInTheDocument();
      expect(screen.getByText('5/10')).toBeInTheDocument();
      expect(screen.getByText('3/10')).toBeInTheDocument();
    });

    it('should display recent symptoms with trend indicators', async () => {
      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText('Your symptoms to update:')).toBeInTheDocument();
      });

      // Check all trend arrows are present
      expect(screen.getByText('↓')).toBeInTheDocument(); // improving
      expect(screen.getByText('→')).toBeInTheDocument(); // stable
      expect(screen.getByText('↑')).toBeInTheDocument(); // worsening

      // Back Pain is unique (only in recent symptoms)
      expect(screen.getByText('Back Pain')).toBeInTheDocument();
    });

    it('should apply correct styles for improving trend', async () => {
      render(<CheckInGuidance />);

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('Your symptoms to update:')).toBeInTheDocument();
      });

      // Find the trend chip with improving indicator - go to parent span (the chip itself)
      const improvingIndicator = screen.getByText('↓');
      const chip = improvingIndicator.parentElement;
      expect(chip).toHaveClass('bg-sage-light/30', 'text-sage');
    });

    it('should apply correct styles for worsening trend', async () => {
      render(<CheckInGuidance />);

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('Your symptoms to update:')).toBeInTheDocument();
      });

      // Back Pain text is directly in the chip span
      const backPainChip = screen.getByText('Back Pain').closest('span');
      expect(backPainChip).toHaveClass('bg-coral/10', 'text-coral');
    });

    it('should apply correct styles for stable trend', async () => {
      render(<CheckInGuidance />);

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('Your symptoms to update:')).toBeInTheDocument();
      });

      // Find the stable trend indicator - go to parent span (the chip itself)
      const stableIndicator = screen.getByText('→');
      const chip = stableIndicator.parentElement;
      expect(chip).toHaveClass('bg-cream', 'text-walnut');
    });

    it('should always display the scoring reminder', async () => {
      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText('Rate each symptom 1-10')).toBeInTheDocument();
        expect(screen.getByText('1 = barely noticeable → 10 = most severe')).toBeInTheDocument();
      });
    });

    it('should display streak motivation message', async () => {
      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText('5-day streak! Keep it going!')).toBeInTheDocument();
      });
    });
  });

  describe('New User (No History)', () => {
    beforeEach(() => {
      mockGetContext.mockResolvedValue({ success: true, data: contextNewUser });
    });

    it('should show welcome guidance for new users', async () => {
      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText('Welcome to your first check-in!')).toBeInTheDocument();
      });

      // Check for example section
      expect(screen.getByText('Example')).toBeInTheDocument();
      // Check for tips section
      expect(screen.getByText('Tips for better tracking')).toBeInTheDocument();
      expect(screen.getByText('Check in daily for the best insights')).toBeInTheDocument();
    });

    it('should still show the scoring reminder for new users', async () => {
      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText('Rate each symptom 1-10')).toBeInTheDocument();
      });
    });

    it('should not show streak message when streak is less than 3', async () => {
      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText('Welcome to your first check-in!')).toBeInTheDocument();
      });

      // Should not show any streak text
      expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
    });
  });

  describe('No Last Check-In but Has Recent Symptoms', () => {
    const contextNoLastCheckIn: CheckInContext = {
      recentSymptoms: [
        { name: 'Headache', frequency: 3, avgSeverity: 5, trend: 'stable' as const },
      ],
      streak: {
        current: 4,
        message: '4-day streak! Keep it going!',
      },
      suggestedTopics: ['Rate symptoms 1-10', 'Activities today'],
    };

    beforeEach(() => {
      mockGetContext.mockResolvedValue({ success: true, data: contextNoLastCheckIn });
    });

    it('should not show last check-in section but show recent symptoms', async () => {
      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.queryByText('Last check-in')).not.toBeInTheDocument();
        expect(screen.getByText('Your symptoms to update:')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show new user guidance on API error', async () => {
      mockGetContext.mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText('Welcome to your first check-in!')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Custom className', () => {
    beforeEach(() => {
      mockGetContext.mockResolvedValue({ success: true, data: contextWithHistory });
    });

    it('should apply custom className', async () => {
      const { container } = render(<CheckInGuidance className="my-custom-class" />);

      await waitFor(() => {
        expect(container.firstChild).toHaveClass('my-custom-class');
      });
    });
  });

  describe('Streak Display Logic', () => {
    it('should not show streak message when current is less than 3', async () => {
      const contextLowStreak: CheckInContext = {
        ...contextWithHistory,
        streak: {
          current: 2,
          message: undefined,
        },
      };
      mockGetContext.mockResolvedValue({ success: true, data: contextLowStreak });

      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText('Your Check-In Guide')).toBeInTheDocument();
      });

      expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
    });

    it('should show streak message when current is 3 or more with message', async () => {
      const contextWithStreak: CheckInContext = {
        ...contextWithHistory,
        streak: {
          current: 7,
          message: '7-day streak! You\'re on a roll!',
        },
      };
      mockGetContext.mockResolvedValue({ success: true, data: contextWithStreak });

      render(<CheckInGuidance />);

      await waitFor(() => {
        expect(screen.getByText("7-day streak! You're on a roll!")).toBeInTheDocument();
      });
    });
  });
});
