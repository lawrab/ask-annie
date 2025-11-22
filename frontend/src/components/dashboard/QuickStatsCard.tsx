import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

export interface QuickStatsCardProps {
  label: string;
  current: number;
  previous: number;
  unit?: string;
  format?: 'number' | 'percentage';
}

/**
 * QuickStatsCard component for displaying metrics with change indicators
 *
 * @example
 * ```tsx
 * <QuickStatsCard
 *   label="Average Severity"
 *   current={6.5}
 *   previous={7.2}
 *   format="number"
 * />
 *
 * <QuickStatsCard
 *   label="Days with Symptoms"
 *   current={75}
 *   previous={85}
 *   unit="%"
 *   format="percentage"
 * />
 * ```
 */
export function QuickStatsCard({
  label,
  current,
  previous,
  unit = '',
  format = 'number',
}: QuickStatsCardProps) {
  // Calculate change
  const change = current - previous;
  const percentChange =
    previous !== 0 ? ((change / previous) * 100) : 0;

  // Determine if change is improvement (lower is better for symptoms)
  const isImprovement = change < 0;
  const isStable = change === 0;

  // Format the current value
  const formatValue = (value: number): string => {
    if (format === 'percentage') {
      return `${value.toFixed(0)}${unit || '%'}`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  // Get arrow icon
  const getArrowIcon = () => {
    if (isStable) {
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      );
    }

    if (isImprovement) {
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
          />
        </svg>
      );
    }

    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    );
  };

  // Get color classes based on trend
  const getColorClasses = () => {
    if (isStable) return 'text-gray-600';
    if (isImprovement) return 'text-green-600';
    return 'text-red-600';
  };

  // Get trend text for screen readers
  const getTrendText = () => {
    if (isStable) return 'no change';
    if (isImprovement) return 'improved';
    return 'worsened';
  };

  return (
    <Card variant="default" padding="default">
      <div className="space-y-2">
        {/* Label */}
        <h3 className="text-sm font-semibold text-gray-700">
          {label}
        </h3>

        {/* Current Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {formatValue(current)}
          </span>
        </div>

        {/* Change Indicator */}
        {!isStable && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', getColorClasses())}>
            <span className="flex-shrink-0">
              {getArrowIcon()}
            </span>
            <span>
              {Math.abs(percentChange).toFixed(1)}%
            </span>
            <span className="text-gray-500 font-normal">
              vs previous period
            </span>
            <span className="sr-only">
              {getTrendText()} by {Math.abs(percentChange).toFixed(1)} percent
            </span>
          </div>
        )}

        {isStable && (
          <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
            <span className="flex-shrink-0">
              {getArrowIcon()}
            </span>
            <span className="text-gray-500 font-normal">
              No change from previous period
            </span>
            <span className="sr-only">stable</span>
          </div>
        )}

        {/* Previous Value (subtle) */}
        <p className="text-xs text-gray-500">
          Previous: {formatValue(previous)}
        </p>
      </div>
    </Card>
  );
}
