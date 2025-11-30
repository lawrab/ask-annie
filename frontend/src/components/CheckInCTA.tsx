import { useNavigate } from 'react-router';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { cn } from '../utils/cn';

export interface CheckInCTAProps {
  /**
   * Timestamp of the last check-in
   */
  lastCheckInTime?: Date | string | null;
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
 * Format last check-in time as relative string
 */
function formatLastCheckIn(timestamp: Date | string | null | undefined): string {
  if (!timestamp) return 'No check-ins yet';

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Today
  if (diffDays === 0) {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }

  // Yesterday
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }

  // Within a week
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // Older
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * CheckInCTA - Single, prominent check-in button with last check-in time
 */
export function CheckInCTA({ lastCheckInTime, isLoading = false, className }: CheckInCTAProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card variant="default" className={cn('p-6', className)}>
        <div className="flex flex-col items-center">
          <div className="animate-pulse bg-gray-200 rounded-md h-12 w-40 mb-3"></div>
          <div className="animate-pulse bg-gray-100 rounded h-4 w-32"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" className={cn('p-6', className)}>
      <div className="flex flex-col items-center">
        <Button
          onClick={() => navigate('/checkin')}
          variant="primary"
          size="large"
          className="px-8"
        >
          Check In Now
        </Button>
        <p className="mt-3 text-sm text-gray-500">
          Last check-in: {formatLastCheckIn(lastCheckInTime)}
        </p>
      </div>
    </Card>
  );
}
