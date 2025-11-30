import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Card } from './ui/Card';
import { CheckInCard } from './CheckInCard';
import type { CheckIn } from '../services/api';
import { cn } from '../utils/cn';

export interface RecentCheckInsProps {
  /**
   * List of recent check-ins to display
   */
  checkIns: CheckIn[];
  /**
   * Maximum number of check-ins to show
   * @default 5
   */
  limit?: number;
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
 * RecentCheckIns - Display recent check-ins with link to full history
 */
export function RecentCheckIns({
  checkIns,
  limit = 5,
  isLoading = false,
  className,
}: RecentCheckInsProps) {
  const navigate = useNavigate();
  const displayedCheckIns = checkIns.slice(0, limit);

  if (isLoading) {
    return (
      <Card variant="default" className={cn('p-6', className)}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Check-ins</h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 rounded-lg h-20"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (checkIns.length === 0) {
    return (
      <Card variant="default" className={cn('p-6', className)}>
        <div className="text-center py-6">
          <p className="text-gray-500">No check-ins yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Your check-in history will appear here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Recent Check-ins</h3>
        </div>

        {/* Check-in list */}
        <div className="space-y-2">
          {displayedCheckIns.map((checkIn) => (
            <CheckInCard key={checkIn._id} checkIn={checkIn} mode="compact" />
          ))}
        </div>

        {/* View all link */}
        {checkIns.length > limit && (
          <button
            onClick={() => navigate('/trends')}
            className="flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View all check-ins
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </Card>
  );
}
