import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InsightCard } from '../InsightCard';

describe('InsightCard', () => {
  describe('Rendering', () => {
    it('renders message correctly', () => {
      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Your headaches have decreased by 30% this week"
        />
      );

      expect(screen.getByText('Your headaches have decreased by 30% this week')).toBeInTheDocument();
    });

    it('renders with default trend icon', () => {
      const { container } = render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders with default correlation icon', () => {
      const { container } = render(
        <InsightCard
          type="correlation"
          severity="low"
          message="Test message"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders with default pattern icon', () => {
      const { container } = render(
        <InsightCard
          type="pattern"
          severity="low"
          message="Test message"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders with custom icon when provided', () => {
      const customIcon = <div data-testid="custom-icon">Custom</div>;

      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
          icon={customIcon}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Severity colors', () => {
    it('applies correct colors for low severity (green)', () => {
      const { container } = render(
        <InsightCard
          type="trend"
          severity="low"
          message="Good news"
        />
      );

      expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
      expect(container.querySelector('.border-green-200')).toBeInTheDocument();
      expect(container.querySelector('.text-green-600')).toBeInTheDocument();
    });

    it('applies correct colors for medium severity (amber)', () => {
      const { container } = render(
        <InsightCard
          type="trend"
          severity="medium"
          message="Neutral news"
        />
      );

      expect(container.querySelector('.bg-amber-50')).toBeInTheDocument();
      expect(container.querySelector('.border-amber-200')).toBeInTheDocument();
      expect(container.querySelector('.text-amber-600')).toBeInTheDocument();
    });

    it('applies correct colors for high severity (red)', () => {
      const { container } = render(
        <InsightCard
          type="trend"
          severity="high"
          message="Warning news"
        />
      );

      expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
      expect(container.querySelector('.border-red-200')).toBeInTheDocument();
      expect(container.querySelector('.text-red-600')).toBeInTheDocument();
    });
  });

  describe('Action button', () => {
    it('renders action button when provided', () => {
      const action = {
        label: 'View Details',
        onClick: vi.fn(),
      };

      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
          action={action}
        />
      );

      expect(screen.getByRole('button', { name: /view details for this insight/i })).toBeInTheDocument();
    });

    it('does not render action button when not provided', () => {
      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onClick when action button clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const action = {
        label: 'View Details',
        onClick,
      };

      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
          action={action}
        />
      );

      const button = screen.getByRole('button', { name: /view details for this insight/i });
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('applies severity-specific button styles for low severity', () => {
      const action = {
        label: 'View Details',
        onClick: vi.fn(),
      };

      const { container } = render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
          action={action}
        />
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('border-green-300');
      expect(button?.className).toContain('hover:bg-green-100');
    });

    it('applies severity-specific button styles for medium severity', () => {
      const action = {
        label: 'View Details',
        onClick: vi.fn(),
      };

      const { container } = render(
        <InsightCard
          type="trend"
          severity="medium"
          message="Test message"
          action={action}
        />
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('border-amber-300');
      expect(button?.className).toContain('hover:bg-amber-100');
    });

    it('applies severity-specific button styles for high severity', () => {
      const action = {
        label: 'View Details',
        onClick: vi.fn(),
      };

      const { container } = render(
        <InsightCard
          type="trend"
          severity="high"
          message="Test message"
          action={action}
        />
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('border-red-300');
      expect(button?.className).toContain('hover:bg-red-100');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label for trend insight with low severity', () => {
      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
        />
      );

      const message = screen.getByRole('status');
      expect(message).toHaveAttribute('aria-label', 'Trend insight: positive');
    });

    it('has proper ARIA label for correlation insight with medium severity', () => {
      render(
        <InsightCard
          type="correlation"
          severity="medium"
          message="Test message"
        />
      );

      const message = screen.getByRole('status');
      expect(message).toHaveAttribute('aria-label', 'Correlation insight: neutral');
    });

    it('has proper ARIA label for pattern insight with high severity', () => {
      render(
        <InsightCard
          type="pattern"
          severity="high"
          message="Test message"
        />
      );

      const message = screen.getByRole('status');
      expect(message).toHaveAttribute('aria-label', 'Pattern insight: warning');
    });

    it('icon has aria-hidden attribute', () => {
      const { container } = render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('action button has descriptive aria-label', () => {
      const action = {
        label: 'View Details',
        onClick: vi.fn(),
      };

      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
          action={action}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'View Details for this insight');
    });

    it('message has role="status" for screen readers', () => {
      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
        />
      );

      const message = screen.getByRole('status');
      expect(message).toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('action button is keyboard accessible', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const action = {
        label: 'View Details',
        onClick,
      };

      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
          action={action}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('action button works with Space key', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const action = {
        label: 'View Details',
        onClick,
      };

      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
          action={action}
        />
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('handles very long messages', () => {
      const longMessage = 'This is a very long message that contains a lot of text and should still render properly without breaking the layout or causing any issues with the component rendering';

      render(
        <InsightCard
          type="trend"
          severity="low"
          message={longMessage}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles messages with special characters', () => {
      const specialMessage = 'Your symptoms improved by 50% & you\'re "doing great"!';

      render(
        <InsightCard
          type="trend"
          severity="low"
          message={specialMessage}
        />
      );

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('handles empty action label gracefully', () => {
      const action = {
        label: '',
        onClick: vi.fn(),
      };

      render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
          action={action}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders correctly with all props combined', () => {
      const customIcon = <div data-testid="custom-icon">Icon</div>;
      const action = {
        label: 'View Details',
        onClick: vi.fn(),
      };

      render(
        <InsightCard
          type="trend"
          severity="high"
          message="Complex message"
          icon={customIcon}
          action={action}
        />
      );

      expect(screen.getByText('Complex message')).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Visual layout', () => {
    it('uses Card component with correct variant', () => {
      const { container } = render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
        />
      );

      // Card should have border-l-4 class for left border accent
      const card = container.querySelector('.border-l-4');
      expect(card).toBeInTheDocument();
    });

    it('uses flexbox layout', () => {
      const { container } = render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
        />
      );

      const flexContainer = container.querySelector('.flex.items-start.gap-4');
      expect(flexContainer).toBeInTheDocument();
    });

    it('icon is flex-shrink-0', () => {
      const { container } = render(
        <InsightCard
          type="trend"
          severity="low"
          message="Test message"
        />
      );

      const iconContainer = container.querySelector('.flex-shrink-0');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
