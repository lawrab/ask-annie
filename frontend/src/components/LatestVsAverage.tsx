import { ArrowUp, ArrowDown, Equal } from 'lucide-react';
import { Card } from './ui/Card';
import { cn } from '../utils/cn';

export interface SymptomComparison {
  name: string;
  latestValue: number;
  averageValue: number;
  trend: 'above' | 'below' | 'equal';
}

export interface LatestVsAverageProps {
  /**
   * Symptoms from latest check-in compared to averages
   */
  symptoms: SymptomComparison[];
  /**
   * Whether data is loading
   */
  isLoading?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
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
    return (
      <Card variant="default" className={cn('p-6', className)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Latest vs Your Average</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 rounded h-12"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (symptoms.length === 0) {
    return null;
  }

  return (
    <Card variant="default" className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest vs Your Average</h3>

      <div className="grid gap-3">
        {symptoms.map((symptom) => {
          const capitalizedName =
            symptom.name.charAt(0).toUpperCase() + symptom.name.slice(1);

          const isAbove = symptom.trend === 'above';
          const isBelow = symptom.trend === 'below';

          const bgColor = isAbove
            ? 'bg-red-50'
            : isBelow
            ? 'bg-emerald-50'
            : 'bg-gray-50';

          const textColor = isAbove
            ? 'text-red-700'
            : isBelow
            ? 'text-emerald-700'
            : 'text-gray-600';

          const statusText = isAbove
            ? 'Higher than usual'
            : isBelow
            ? 'Lower than usual'
            : 'About normal';

          const Icon = isAbove ? ArrowUp : isBelow ? ArrowDown : Equal;

          return (
            <div
              key={symptom.name}
              className={cn('rounded-lg p-4', bgColor)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{capitalizedName}</p>
                  <p className="text-sm text-gray-600">
                    Now: <span className="font-medium">{symptom.latestValue}</span>
                    {' · '}
                    Avg: <span className="font-medium">{symptom.averageValue.toFixed(1)}</span>
                  </p>
                </div>
                <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full', bgColor, textColor)}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{statusText}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
