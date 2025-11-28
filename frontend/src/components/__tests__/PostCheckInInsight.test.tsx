import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import PostCheckInInsight from '../PostCheckInInsight';
import { InsightCard } from '../../services/api';

// Mock data for different card types
const dataContextInsight: InsightCard = {
  type: 'data_context',
  title: "Today's Context",
  message: "Your headache (6/10) is below your 2-week average of 7.2.\nYou're trending better than usual.",
  icon: '📊',
  metadata: {
    symptomName: 'headache',
    currentValue: 6,
    averageValue: 7.2,
  },
};

const validationInsight: InsightCard = {
  type: 'validation',
  title: 'You Showed Up',
  message: "Managing an 8/10 pain day while staying consistent?\nThat takes real strength. We see you.",
  icon: '💚',
  metadata: {
    maxSeverity: 8,
    checkInCount: 10,
  },
};

const patternInsight: InsightCard = {
  type: 'pattern',
  title: 'Pattern Detected',
  message: "You've logged headaches on the last 3 Tuesdays.\nThis weekly pattern could be worth investigating.",
  icon: '🔍',
  metadata: {
    symptom: 'headache',
    pattern: 'tuesday',
  },
};

const communityInsight: InsightCard = {
  type: 'community',
  title: "You're Not Alone",
  message: "68% of users also track weather changes with headaches.\nYou're part of a community seeking answers.",
  icon: '📊',
};

describe('PostCheckInInsight', () => {
  let mockOnDismiss: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnDismiss = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const renderComponent = (insight: InsightCard, autoHideDuration?: number) => {
    return render(
      <BrowserRouter>
        <PostCheckInInsight
          insight={insight}
          onDismiss={mockOnDismiss}
          autoHideDuration={autoHideDuration}
        />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render data context insight correctly', () => {
      renderComponent(dataContextInsight);

      expect(screen.getByText("Today's Context")).toBeInTheDocument();
      expect(screen.getByText(/Your headache \(6\/10\)/)).toBeInTheDocument();
      expect(screen.getByText(/trending better/)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Insight icon' })).toHaveTextContent('📊');
    });

    it('should render validation insight correctly', () => {
      renderComponent(validationInsight);

      expect(screen.getByText('You Showed Up')).toBeInTheDocument();
      expect(screen.getByText(/Managing an 8\/10 pain day/)).toBeInTheDocument();
      expect(screen.getByText(/That takes real strength/)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Insight icon' })).toHaveTextContent('💚');
    });

    it('should render pattern insight correctly', () => {
      renderComponent(patternInsight);

      expect(screen.getByText('Pattern Detected')).toBeInTheDocument();
      expect(screen.getByText(/last 3 Tuesdays/)).toBeInTheDocument();
      expect(screen.getByText(/worth investigating/)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Insight icon' })).toHaveTextContent('🔍');
    });

    it('should render community insight correctly', () => {
      renderComponent(communityInsight);

      expect(screen.getByText("You're Not Alone")).toBeInTheDocument();
      expect(screen.getByText(/68% of users/)).toBeInTheDocument();
      expect(screen.getByText(/part of a community/)).toBeInTheDocument();
    });

    it('should split message by newlines into separate paragraphs', () => {
      renderComponent(dataContextInsight);

      const messageDiv = document.getElementById('insight-message');

      expect(messageDiv).toBeInTheDocument();
      const paragraphs = messageDiv?.querySelectorAll('p');
      expect(paragraphs).toHaveLength(2);
      expect(paragraphs?.[0]).toHaveTextContent(/headache/);
      expect(paragraphs?.[1]).toHaveTextContent(/trending better/);
    });

    it('should show Continue to Dashboard button', () => {
      renderComponent(dataContextInsight);

      const button = screen.getByRole('button', { name: /Continue to Dashboard/i });
      expect(button).toBeInTheDocument();
    });

    it('should show close button', () => {
      renderComponent(dataContextInsight);

      const closeButton = screen.getByRole('button', { name: /Close insight/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Gradient Backgrounds', () => {
    it('should apply blue gradient for data_context type', () => {
      renderComponent(dataContextInsight);
      const region = screen.getByRole('region');
      expect(region).toHaveClass('bg-gradient-to-br', 'from-blue-50', 'to-blue-100');
    });

    it('should apply green gradient for validation type', () => {
      renderComponent(validationInsight);
      const region = screen.getByRole('region');
      expect(region).toHaveClass('bg-gradient-to-br', 'from-green-50', 'to-green-100');
    });

    it('should apply purple gradient for pattern type', () => {
      renderComponent(patternInsight);
      const region = screen.getByRole('region');
      expect(region).toHaveClass('bg-gradient-to-br', 'from-purple-50', 'to-purple-100');
    });

    it('should apply orange gradient for community type', () => {
      renderComponent(communityInsight);
      const region = screen.getByRole('region');
      expect(region).toHaveClass('bg-gradient-to-br', 'from-orange-50', 'to-orange-100');
    });
  });

  describe('User Interactions', () => {
    it('should call onDismiss when Continue button is clicked', () => {
      renderComponent(dataContextInsight);

      const button = screen.getByRole('button', { name: /Continue to Dashboard/i });
      fireEvent.click(button);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when close button is clicked', () => {
      renderComponent(dataContextInsight);

      const closeButton = screen.getByRole('button', { name: /Close insight/i });
      fireEvent.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when Escape key is pressed', () => {
      renderComponent(dataContextInsight);

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not call onDismiss for other keys', () => {
      renderComponent(dataContextInsight);

      fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(window, { key: 'Space', code: 'Space' });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after default duration (10 seconds)', () => {
      renderComponent(dataContextInsight);

      expect(mockOnDismiss).not.toHaveBeenCalled();

      // Fast-forward time by 10 seconds
      vi.advanceTimersByTime(10000);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should auto-dismiss after custom duration', () => {
      renderComponent(dataContextInsight, 5000);

      expect(mockOnDismiss).not.toHaveBeenCalled();

      // Fast-forward time by 5 seconds
      vi.advanceTimersByTime(5000);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not auto-dismiss when duration is 0', () => {
      renderComponent(dataContextInsight, 0);

      // Fast-forward time by 15 seconds
      vi.advanceTimersByTime(15000);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('should clear timer on unmount', () => {
      const { unmount } = renderComponent(dataContextInsight);

      unmount();

      // Fast-forward time
      vi.advanceTimersByTime(10000);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderComponent(dataContextInsight);

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'insight-title');
      expect(region).toHaveAttribute('aria-describedby', 'insight-message');
    });

    it('should have accessible icon with aria-label', () => {
      renderComponent(dataContextInsight);

      const icon = screen.getByRole('img', { name: 'Insight icon' });
      expect(icon).toBeInTheDocument();
    });

    it('should have id on title for aria-labelledby', () => {
      renderComponent(dataContextInsight);

      const title = screen.getByText("Today's Context");
      expect(title).toHaveAttribute('id', 'insight-title');
    });

    it('should have id on message for aria-describedby', () => {
      renderComponent(dataContextInsight);

      const messageDiv = document.getElementById('insight-message');
      expect(messageDiv).toBeInTheDocument();
    });

    it('should have accessible close button label', () => {
      renderComponent(dataContextInsight);

      const closeButton = screen.getByRole('button', { name: 'Close insight' });
      expect(closeButton).toHaveAttribute('aria-label', 'Close insight');
    });
  });

  describe('Edge Cases', () => {
    it('should handle message without newlines', () => {
      const singleLineInsight: InsightCard = {
        type: 'validation',
        title: 'Great Job',
        message: 'You checked in today!',
        icon: '💚',
      };

      renderComponent(singleLineInsight);

      const messageDiv = document.getElementById('insight-message');
      const paragraphs = messageDiv?.querySelectorAll('p');
      expect(paragraphs).toHaveLength(1);
      expect(paragraphs?.[0]).toHaveTextContent('You checked in today!');
    });

    it('should filter out empty lines from message', () => {
      const multiLineInsight: InsightCard = {
        type: 'validation',
        title: 'Test',
        message: 'Line 1\n\n\nLine 2',
        icon: '💚',
      };

      renderComponent(multiLineInsight);

      const messageDiv = document.getElementById('insight-message');
      const paragraphs = messageDiv?.querySelectorAll('p');
      expect(paragraphs).toHaveLength(2);
      expect(paragraphs?.[0]).toHaveTextContent('Line 1');
      expect(paragraphs?.[1]).toHaveTextContent('Line 2');
    });

    it('should handle insight without metadata', () => {
      const insightWithoutMetadata: InsightCard = {
        type: 'validation',
        title: 'Simple Insight',
        message: 'Simple message',
        icon: '💚',
      };

      expect(() => renderComponent(insightWithoutMetadata)).not.toThrow();
    });
  });
});
