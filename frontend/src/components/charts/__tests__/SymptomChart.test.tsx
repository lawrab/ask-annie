import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SymptomChart } from '../SymptomChart';

// Mock recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, onClick }: { children: React.ReactNode; onClick?: (event: unknown) => void }) => (
    <div
      data-testid="line-chart"
      onClick={() => onClick?.({
        activePayload: [{ payload: { date: '2025-01-15' } }]
      })}
    >
      {children}
    </div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((_date, formatStr) => {
    if (formatStr === 'MMM d') {
      return 'Jan 15';
    }
    return '2025-01-15';
  }),
  parseISO: vi.fn((dateStr: string) => new Date(dateStr)),
}));

describe('SymptomChart', () => {
  const mockData = [
    { date: '2025-01-10', value: 5, count: 1 },
    { date: '2025-01-11', value: 6, count: 1 },
    { date: '2025-01-12', value: 7, count: 1 },
    { date: '2025-01-13', value: 4, count: 1 },
    { date: '2025-01-14', value: 8, count: 1 },
  ];

  const defaultProps = {
    data: mockData,
    symptomName: 'Headache',
    dateRange: { start: '2025-01-10', end: '2025-01-14' },
  };

  describe('Rendering with data', () => {
    it('renders chart with data', () => {
      render(<SymptomChart {...defaultProps} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('grid')).toBeInTheDocument();
    });

    it('renders chart wrapper with minimum height', () => {
      const { container } = render(<SymptomChart {...defaultProps} />);

      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveStyle({ minHeight: '300px' });
    });

    it('renders all chart components', () => {
      render(<SymptomChart {...defaultProps} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no data provided', () => {
      render(<SymptomChart {...defaultProps} data={[]} />);

      expect(screen.getByText('No data for selected period')).toBeInTheDocument();
      expect(screen.getByText('Try selecting a different time range or symptom')).toBeInTheDocument();
    });

    it('shows empty state when data is null', () => {
      render(<SymptomChart {...defaultProps} data={null} />);

      expect(screen.getByText('No data for selected period')).toBeInTheDocument();
    });

    it('shows empty state when data is undefined', () => {
      render(<SymptomChart {...defaultProps} data={undefined} />);

      expect(screen.getByText('No data for selected period')).toBeInTheDocument();
    });

    it('renders chart icon in empty state', () => {
      const { container } = render(<SymptomChart {...defaultProps} data={[]} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-gray-400');
    });

    it('does not render chart components in empty state', () => {
      render(<SymptomChart {...defaultProps} data={[]} />);

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('line')).not.toBeInTheDocument();
    });
  });

  describe('Date formatting', () => {
    it('handles invalid dates gracefully', () => {
      const invalidData = [{ date: 'invalid-date', value: 5, count: 1 }];

      render(<SymptomChart {...defaultProps} data={invalidData} />);

      // Should render without crashing
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders X-axis component', () => {
      render(<SymptomChart {...defaultProps} />);

      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    });
  });

  describe('Y-axis configuration', () => {
    it('renders Y-axis component', () => {
      render(<SymptomChart {...defaultProps} />);

      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('displays tooltip component', () => {
      render(<SymptomChart {...defaultProps} />);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('Click interactions', () => {
    it('renders clickable chart', async () => {
      const onDateClick = vi.fn();

      render(<SymptomChart {...defaultProps} onDateClick={onDateClick} />);

      const chart = screen.getByTestId('line-chart');
      expect(chart).toBeInTheDocument();
    });

    it('does not crash when callback not provided', async () => {
      const user = userEvent.setup();

      render(<SymptomChart {...defaultProps} />);

      const chart = screen.getByTestId('line-chart');
      await user.click(chart);

      // Should not throw error
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles single data point', () => {
      const singleData = [{ date: '2025-01-15', value: 5, count: 1 }];

      render(<SymptomChart {...defaultProps} data={singleData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles data with extreme values', () => {
      const extremeData = [
        { date: '2025-01-15', value: 1, count: 1 },
        { date: '2025-01-16', value: 10, count: 1 },
      ];

      render(<SymptomChart {...defaultProps} data={extremeData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles very long symptom name', () => {
      const longName = 'Very Long Symptom Name That Should Still Render Correctly';

      render(<SymptomChart {...defaultProps} symptomName={longName} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles large dataset', () => {
      const largeData = Array.from({ length: 90 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(2, '0')}`,
        value: Math.floor(Math.random() * 10) + 1,
      }));

      render(<SymptomChart {...defaultProps} data={largeData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper minimum height for visibility', () => {
      const { container } = render(<SymptomChart {...defaultProps} />);

      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveStyle({ minHeight: '300px' });
    });

    it('empty state is accessible', () => {
      const { container } = render(<SymptomChart {...defaultProps} data={[]} />);

      const emptyState = container.querySelector('.border-dashed');
      expect(emptyState).toBeInTheDocument();
    });
  });
});
