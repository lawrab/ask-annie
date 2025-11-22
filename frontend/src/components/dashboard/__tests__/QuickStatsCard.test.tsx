import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickStatsCard } from '../QuickStatsCard';

describe('QuickStatsCard', () => {
  describe('Value display', () => {
    it('displays current value correctly with number format', () => {
      render(
        <QuickStatsCard
          label="Average Severity"
          current={6.5}
          previous={7.2}
          format="number"
        />
      );

      expect(screen.getByText('6.5')).toBeInTheDocument();
    });

    it('displays current value correctly with percentage format', () => {
      render(
        <QuickStatsCard
          label="Days with Symptoms"
          current={75}
          previous={85}
          format="percentage"
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('displays label correctly', () => {
      render(
        <QuickStatsCard
          label="Average Severity"
          current={6.5}
          previous={7.2}
          format="number"
        />
      );

      expect(screen.getByText('Average Severity')).toBeInTheDocument();
    });

    it('displays previous value', () => {
      render(
        <QuickStatsCard
          label="Average Severity"
          current={6.5}
          previous={7.2}
          format="number"
        />
      );

      expect(screen.getByText('Previous: 7.2')).toBeInTheDocument();
    });
  });

  describe('Number formatting', () => {
    it('formats numbers to 1 decimal place', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={6.543}
          previous={7.234}
          format="number"
        />
      );

      expect(screen.getByText('6.5')).toBeInTheDocument();
      expect(screen.getByText('Previous: 7.2')).toBeInTheDocument();
    });

    it('formats percentages to 0 decimal places', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={75.6}
          previous={85.2}
          format="percentage"
        />
      );

      expect(screen.getByText('76%')).toBeInTheDocument();
      expect(screen.getByText('Previous: 85%')).toBeInTheDocument();
    });

    it('handles integer values', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={7}
          previous={8}
          format="number"
        />
      );

      expect(screen.getByText('7.0')).toBeInTheDocument();
    });

    it('uses custom unit when provided', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={6}
          unit="pts"
          format="number"
        />
      );

      expect(screen.getByText('5.0pts')).toBeInTheDocument();
    });

    it('uses default % for percentage format', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={75}
          previous={85}
          format="percentage"
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('can override unit for percentage format', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={75}
          previous={85}
          unit=" percent"
          format="percentage"
        />
      );

      expect(screen.getByText('75 percent')).toBeInTheDocument();
    });
  });

  describe('Percentage change calculation', () => {
    it('calculates percentage change correctly for decrease', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={6}
          previous={10}
          format="number"
        />
      );

      // (6 - 10) / 10 * 100 = -40%
      expect(screen.getByText('40.0%')).toBeInTheDocument();
    });

    it('calculates percentage change correctly for increase', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={15}
          previous={10}
          format="number"
        />
      );

      // (15 - 10) / 10 * 100 = 50%
      expect(screen.getByText('50.0%')).toBeInTheDocument();
    });

    it('shows absolute value of percentage change', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={10}
          format="number"
        />
      );

      // Should show 50.0%, not -50.0%
      expect(screen.getByText('50.0%')).toBeInTheDocument();
    });

    it('handles zero previous value gracefully', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={0}
          format="number"
        />
      );

      // Should show 0.0% when previous is 0
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });

  describe('Trend arrows', () => {
    it('shows down arrow for improvement (decrease)', () => {
      const { container } = render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={7}
          format="number"
        />
      );

      const arrow = container.querySelector('svg');
      expect(arrow).toBeInTheDocument();
      expect(arrow).toHaveAttribute('aria-hidden', 'true');
    });

    it('shows up arrow for decline (increase)', () => {
      const { container } = render(
        <QuickStatsCard
          label="Test"
          current={8}
          previous={6}
          format="number"
        />
      );

      const arrow = container.querySelector('svg');
      expect(arrow).toBeInTheDocument();
    });

    it('shows right arrow for stable (no change)', () => {
      const { container } = render(
        <QuickStatsCard
          label="Test"
          current={7}
          previous={7}
          format="number"
        />
      );

      const arrow = container.querySelector('svg');
      expect(arrow).toBeInTheDocument();
    });

    it('does not show percentage for stable values', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={7}
          previous={7}
          format="number"
        />
      );

      expect(screen.queryByText(/0\.0%/)).not.toBeInTheDocument();
    });
  });

  describe('Color coding', () => {
    it('applies green color for improvement', () => {
      const { container } = render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={7}
          format="number"
        />
      );

      const indicator = container.querySelector('.text-green-600');
      expect(indicator).toBeInTheDocument();
    });

    it('applies red color for decline', () => {
      const { container } = render(
        <QuickStatsCard
          label="Test"
          current={8}
          previous={6}
          format="number"
        />
      );

      const indicator = container.querySelector('.text-red-600');
      expect(indicator).toBeInTheDocument();
    });

    it('applies gray color for stable', () => {
      const { container } = render(
        <QuickStatsCard
          label="Test"
          current={7}
          previous={7}
          format="number"
        />
      );

      const indicator = container.querySelector('.text-gray-600');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has screen reader text for improvement', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={10}
          format="number"
        />
      );

      const srText = screen.getByText(/improved by 50\.0 percent/i);
      expect(srText).toHaveClass('sr-only');
    });

    it('has screen reader text for decline', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={10}
          previous={5}
          format="number"
        />
      );

      const srText = screen.getByText(/worsened by 100\.0 percent/i);
      expect(srText).toHaveClass('sr-only');
    });

    it('has screen reader text for stable', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={7}
          previous={7}
          format="number"
        />
      );

      const srText = screen.getByText(/stable/i);
      expect(srText).toHaveClass('sr-only');
    });

    it('arrow icons are hidden from screen readers', () => {
      const { container } = render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={7}
          format="number"
        />
      );

      const arrow = container.querySelector('svg');
      expect(arrow).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Text content', () => {
    it('shows "vs previous period" for non-stable changes', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={7}
          format="number"
        />
      );

      expect(screen.getByText('vs previous period')).toBeInTheDocument();
    });

    it('shows "No change from previous period" for stable', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={7}
          previous={7}
          format="number"
        />
      );

      expect(screen.getByText('No change from previous period')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles very small differences', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={5.001}
          previous={5.000}
          format="number"
        />
      );

      // Should still show change, not stable
      expect(screen.getByText(/vs previous period/)).toBeInTheDocument();
    });

    it('handles negative values', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={-5}
          previous={-3}
          format="number"
        />
      );

      expect(screen.getByText('-5.0')).toBeInTheDocument();
    });

    it('handles zero current value', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={0}
          previous={5}
          format="number"
        />
      );

      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });

    it('handles large numbers', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={1000.5}
          previous={999.2}
          format="number"
        />
      );

      expect(screen.getByText('1000.5')).toBeInTheDocument();
    });

    it('handles decimal precision correctly', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={6.666666}
          previous={7.777777}
          format="number"
        />
      );

      expect(screen.getByText('6.7')).toBeInTheDocument();
      expect(screen.getByText('Previous: 7.8')).toBeInTheDocument();
    });

    it('handles very large percentage changes', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={100}
          previous={1}
          format="number"
        />
      );

      // (100 - 1) / 1 * 100 = 9900%
      expect(screen.getByText('9900.0%')).toBeInTheDocument();
    });
  });

  describe('Visual structure', () => {
    it('uses Card component', () => {
      const { container } = render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={7}
          format="number"
        />
      );

      // Card component should be present
      const card = container.firstChild;
      expect(card).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(
        <QuickStatsCard
          label="Average Severity"
          current={5}
          previous={7}
          format="number"
        />
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Average Severity');
    });

    it('displays current value prominently', () => {
      const { container } = render(
        <QuickStatsCard
          label="Test"
          current={6.5}
          previous={7.2}
          format="number"
        />
      );

      const currentValue = container.querySelector('.text-3xl.font-bold');
      expect(currentValue).toHaveTextContent('6.5');
    });

    it('displays previous value subtly', () => {
      const { container } = render(
        <QuickStatsCard
          label="Test"
          current={6.5}
          previous={7.2}
          format="number"
        />
      );

      const previousValue = container.querySelector('.text-xs.text-gray-500');
      expect(previousValue).toHaveTextContent('Previous: 7.2');
    });
  });

  describe('Default props', () => {
    it('defaults to empty string for unit', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={7}
          format="number"
        />
      );

      // Should show value without any unit
      expect(screen.getByText('5.0')).toBeInTheDocument();
    });

    it('defaults to "number" format', () => {
      render(
        <QuickStatsCard
          label="Test"
          current={5}
          previous={7}
        />
      );

      // Should format as number with 1 decimal
      expect(screen.getByText('5.0')).toBeInTheDocument();
    });
  });
});
