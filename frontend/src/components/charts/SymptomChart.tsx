import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { format, parseISO } from 'date-fns';

export interface SymptomChartProps {
  data: Array<{ date: string; value: number }> | null | undefined;
  symptomName: string;
  dateRange: { start: string; end: string };
  onDateClick?: (date: string) => void;
}

/**
 * SymptomChart component for visualizing symptom severity trends over time
 *
 * @example
 * ```tsx
 * <SymptomChart
 *   data={[
 *     { date: '2025-01-01', value: 5 },
 *     { date: '2025-01-02', value: 7 },
 *   ]}
 *   symptomName="Headache"
 *   dateRange={{ start: '2025-01-01', end: '2025-01-07' }}
 *   onDateClick={(date) => console.log('Clicked:', date)}
 * />
 * ```
 */
export function SymptomChart({
  data,
  symptomName,
  onDateClick,
}: SymptomChartProps) {
  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d');
    } catch {
      return dateString;
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      const date = dataPoint.payload.date;
      const value = dataPoint.value;

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">
            {formatDate(date)}
          </p>
          <p className="text-sm text-gray-600">
            Severity: <span className="font-semibold text-indigo-600">{value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{ minHeight: '300px' }}
      >
        <div className="text-center p-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data for selected period</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try selecting a different time range or symptom
          </p>
        </div>
      </div>
    );
  }

  // Handle click on chart
  const handleClick = (chartData: unknown) => {
    if (onDateClick && chartData && typeof chartData === 'object' && 'activePayload' in chartData) {
      const payload = (chartData as { activePayload?: Array<{ payload?: { date?: string } }> }).activePayload;
      const date = payload?.[0]?.payload?.date;
      if (date) {
        onDateClick(date);
      }
    }
  };

  return (
    <div className="w-full" style={{ minHeight: '300px' }}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          onClick={handleClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
            label={{
              value: 'Severity',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '12px', fill: '#6b7280' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4F46E5"
            strokeWidth={2}
            dot={{ fill: '#4F46E5', r: 4 }}
            activeDot={{ r: 6, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
            name={symptomName}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
