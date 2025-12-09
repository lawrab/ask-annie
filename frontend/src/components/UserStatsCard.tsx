import { useEffect, useState } from 'react';
import { reportingApi } from '../services/api';
import type { IndividualUserStats } from '../services/api';
import { Alert } from './ui/Alert';

export function UserStatsCard() {
  const [stats, setStats] = useState<IndividualUserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await reportingApi.getMyStats();

        if (response.success) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
        setError('Failed to load your statistics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Activity</h2>

      <div className="space-y-4">
        {/* Total Check-ins */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Total Check-ins</span>
          <span className="text-2xl font-bold text-blue-600">{stats.checkInCount}</span>
        </div>

        {/* First Check-in */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">First Check-in</span>
          <span className="text-sm text-gray-900 font-medium">
            {formatShortDate(stats.firstCheckIn)}
          </span>
        </div>

        {/* Last Check-in */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Last Check-in</span>
          <span className="text-sm text-gray-900 font-medium">
            {formatDate(stats.lastCheckIn)}
          </span>
        </div>

        {/* Member Since */}
        <div className="flex items-center justify-between py-3">
          <span className="text-gray-600">Member Since</span>
          <span className="text-sm text-gray-900 font-medium">
            {formatShortDate(stats.registeredAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
