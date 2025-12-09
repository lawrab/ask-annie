import { useEffect, useState } from 'react';
import { reportingApi } from '../services/api';
import type { SystemStats, UserStats } from '../services/api';
import { Alert } from '../components/ui/Alert';
import { Header } from '../components/Header';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof UserStats>('registeredAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await reportingApi.getAdminStats();

        if (response.success) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
        setError(
          err instanceof Error && err.message.includes('403')
            ? 'Access denied. Admin privileges required.'
            : 'Failed to load admin statistics.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleSort = (field: keyof UserStats) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedUsers = stats?.users.slice().sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === null) return 1;
    if (bValue === null) return -1;

    let comparison = 0;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      // For date strings, convert to Date for proper comparison
      if (sortField === 'lastCheckIn' || sortField === 'registeredAt') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        comparison = aDate.getTime() - bDate.getTime();
      } else {
        comparison = aValue.localeCompare(bValue);
      }
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="admin" />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

          {error && <Alert type="error">{error}</Alert>}

          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : (
            stats && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Total Users
                    </h2>
                    <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Total Check-ins
                    </h2>
                    <p className="text-4xl font-bold text-green-600">{stats.totalCheckIns}</p>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('username')}
                          >
                            Username {sortField === 'username' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('email')}
                          >
                            Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('checkInCount')}
                          >
                            Check-ins{' '}
                            {sortField === 'checkInCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('lastCheckIn')}
                          >
                            Last Check-in{' '}
                            {sortField === 'lastCheckIn' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('registeredAt')}
                          >
                            Registered{' '}
                            {sortField === 'registeredAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedUsers?.map((user) => (
                          <tr key={user.userId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.checkInCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.lastCheckIn)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.registeredAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {(!sortedUsers || sortedUsers.length === 0) && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No users found</p>
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </div>
      </main>
    </div>
  );
}
