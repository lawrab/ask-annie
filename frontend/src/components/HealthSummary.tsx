import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card } from './ui/Card';
import { cn } from '../utils/cn';
import { formatDisplayName } from '../utils/string';

export interface TopSymptom {
  name: string;
  avgSeverity: number | null;
  trend: 'improving' | 'worsening' | 'stable';
}

export interface HealthSummaryProps {
  /**
   * Average severity score (1-10)
   */
  averageSeverity: number;
  /**
   * Trend direction
   */
  trend: 'improving' | 'worsening' | 'stable';
  /**
   * Top symptoms to display
   */
  topSymptoms: TopSymptom[];
  /**
   * Whether data is still loading
   */
  isLoading?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get color class based on severity score
 * Green: 1-3 (low), Amber: 4-7 (moderate), Red: 8-10 (high)
 */
function getSeverityColor(severity: number): string {
  if (severity <= 3) return 'text-emerald-600';
  if (severity <= 7) return 'text-amber-500';
  return 'text-red-600';
}

/**
 * Get background color class for severity zone
 */
function getSeverityBgColor(severity: number): string {
  if (severity <= 3) return 'bg-emerald-50';
  if (severity <= 7) return 'bg-amber-50';
  return 'bg-red-50';
}

/**
 * Get label for severity zone
 */
function getSeverityLabel(severity: number): string {
  if (severity <= 3) return 'Doing well';
  if (severity <= 7) return 'Managing';
  return 'Struggling';
}

/**
 * HealthSummary - Primary "How am I doing?" display
 * Shows overall health status with severity score and trend
 */
export function HealthSummary({
  averageSeverity,
  trend,
  topSymptoms,
  isLoading = false,
  className,
}: HealthSummaryProps) {
  if (isLoading) {
    return (
      <Card variant="elevated" className={cn('p-8', className)}>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-3 text-gray-500">Loading your health summary...</p>
        </div>
      </Card>
    );
  }

  const severityColor = getSeverityColor(averageSeverity);
  const severityBgColor = getSeverityBgColor(averageSeverity);
  const severityLabel = getSeverityLabel(averageSeverity);

  const TrendIcon = trend === 'improving' ? TrendingDown : trend === 'worsening' ? TrendingUp : Minus;
  const trendColor =
    trend === 'improving' ? 'text-emerald-600' : trend === 'worsening' ? 'text-red-600' : 'text-gray-500';
  const trendLabel =
    trend === 'improving' ? 'Getting better' : trend === 'worsening' ? 'Getting harder' : 'Holding steady';

  return (
    <Card variant="elevated" className={cn('p-6 sm:p-8', className)}>
      <div className="text-center">
        {/* Title */}
        <h2 className="text-lg sm:text-xl font-medium text-gray-600 mb-6">
          How are you doing?
        </h2>

        {/* Score display */}
        <div className={cn('inline-flex flex-col items-center rounded-2xl px-8 py-6', severityBgColor)}>
          <span className={cn('text-5xl sm:text-6xl font-bold', severityColor)}>
            {averageSeverity.toFixed(1)}
          </span>
          <span className="text-gray-500 text-sm mt-1">out of 10</span>
          <span className={cn('text-base font-medium mt-2', severityColor)}>
            {severityLabel}
          </span>
        </div>

        {/* Trend indicator */}
        <div className={cn('flex items-center justify-center gap-2 mt-4', trendColor)}>
          <TrendIcon className="h-5 w-5" />
          <span className="font-medium">{trendLabel}</span>
        </div>

        {/* Top symptoms */}
        {topSymptoms.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">Top concerns this week</p>
            <div className="flex flex-wrap justify-center gap-2">
              {topSymptoms.slice(0, 3).map((symptom) => (
                <span
                  key={symptom.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  <span>{formatDisplayName(symptom.name)}</span>
                  {symptom.avgSeverity !== null && (
                    <span className="text-gray-500">({symptom.avgSeverity.toFixed(1)})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
