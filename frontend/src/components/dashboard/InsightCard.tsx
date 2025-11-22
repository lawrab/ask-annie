import { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export interface InsightCardProps {
  type: 'trend' | 'correlation' | 'pattern';
  message: string;
  severity: 'low' | 'medium' | 'high';
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * InsightCard component for displaying AI-generated insights about health patterns
 *
 * @example
 * ```tsx
 * <InsightCard
 *   type="trend"
 *   severity="low"
 *   message="Your headaches have decreased by 30% this week"
 *   action={{
 *     label: "View Details",
 *     onClick: () => navigate('/trends')
 *   }}
 * />
 * ```
 */
export function InsightCard({ type, message, severity, icon, action }: InsightCardProps) {
  // Severity-based colors
  const severityStyles = {
    low: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-800',
    },
    medium: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      text: 'text-amber-800',
    },
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-800',
    },
  };

  // Default icons based on type
  const defaultIcons = {
    trend: (
      <svg
        className="h-6 w-6"
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
    ),
    correlation: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
        />
      </svg>
    ),
    pattern: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  };

  const displayIcon = icon || defaultIcons[type];
  const styles = severityStyles[severity];

  // Get ARIA label for type
  const typeLabels = {
    trend: 'Trend insight',
    correlation: 'Correlation insight',
    pattern: 'Pattern insight',
  };

  // Get severity label for accessibility
  const severityLabels = {
    low: 'positive',
    medium: 'neutral',
    high: 'warning',
  };

  return (
    <Card
      variant="outlined"
      padding="default"
      className={cn(styles.bg, styles.border, 'border-l-4')}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn('flex-shrink-0', styles.icon)} aria-hidden="true">
          {displayIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn('text-sm font-medium', styles.text)}
            role="status"
            aria-label={`${typeLabels[type]}: ${severityLabels[severity]}`}
          >
            {message}
          </p>
        </div>

        {/* Action Button */}
        {action && (
          <div className="flex-shrink-0">
            <Button
              onClick={action.onClick}
              variant="secondary"
              size="small"
              className={cn(
                'whitespace-nowrap',
                severity === 'low' && 'border-green-300 hover:bg-green-100',
                severity === 'medium' && 'border-amber-300 hover:bg-amber-100',
                severity === 'high' && 'border-red-300 hover:bg-red-100'
              )}
              aria-label={`${action.label} for this insight`}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
