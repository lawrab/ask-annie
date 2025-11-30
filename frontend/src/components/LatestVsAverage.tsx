import { ArrowUp, ArrowDown, Equal, type LucideIcon } from 'lucide-react';
import { Card } from './ui/Card';
import { cn } from '../utils/cn';
import { formatDisplayName, formatNumber } from '../utils/string';

// Types
export type TrendDirection = 'above' | 'below' | 'equal';

export interface SymptomComparison {
  name: string;
  latestValue: number;
  averageValue: number;
  trend: TrendDirection;
}

export interface LatestVsAverageProps {
  symptoms: SymptomComparison[];
  isLoading?: boolean;
  className?: string;
}

// Configuration for trend display
interface TrendConfig {
  bgColor: string;
  textColor: string;
  statusText: string;
  Icon: LucideIcon;
}

const TREND_CONFIG: Record<TrendDirection, TrendConfig> = {
  above: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    statusText: 'Higher than usual',
    Icon: ArrowUp,
  },
  below: {
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    statusText: 'Lower than usual',
    Icon: ArrowDown,
  },
  equal: {
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    statusText: 'About normal',
    Icon: Equal,
  },
};

// Sub-components
interface SymptomComparisonCardProps {
  symptom: SymptomComparison;
}

function SymptomComparisonCard({ symptom }: SymptomComparisonCardProps) {
  const config = TREND_CONFIG[symptom.trend];
  const { bgColor, textColor, statusText, Icon } = config;

  return (
    <div className={cn('rounded-lg p-4', bgColor)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{formatDisplayName(symptom.name)}</p>
          <p className="text-sm text-gray-600">
            Now: <span className="font-medium">{formatNumber(symptom.latestValue)}</span>
            {' · '}
            Avg: <span className="font-medium">{formatNumber(symptom.averageValue)}</span>
          </p>
        </div>
        <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full', bgColor, textColor)}>
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{statusText}</span>
        </div>
      </div>
    </div>
  );
}

function LatestVsAverageSkeleton({ className }: { className?: string }) {
  return (
    <Card variant="default" className={cn('p-6', className)}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Latest vs Your Average</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-100 rounded h-12" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * LatestVsAverage - Shows how latest check-in compares to historical averages
 */
export function LatestVsAverage({
  symptoms,
  isLoading = false,
  className,
}: LatestVsAverageProps) {
  if (isLoading) {
    return <LatestVsAverageSkeleton className={className} />;
  }

  if (symptoms.length === 0) {
    return null;
  }

  return (
    <Card variant="default" className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest vs Your Average</h3>
      <div className="grid gap-3">
        {symptoms.map((symptom) => (
          <SymptomComparisonCard key={symptom.name} symptom={symptom} />
        ))}
      </div>
    </Card>
  );
}
