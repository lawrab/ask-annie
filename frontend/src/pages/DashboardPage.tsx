import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { checkInsApi, analysisApi } from '../services/api';
import type {
  DailyStatusResponse,
  StreakResponse,
  QuickStatsResponse,
  CheckIn,
} from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CheckInCard } from '../components/CheckInCard';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Section A: Daily Momentum
  const [statusData, setStatusData] = useState<DailyStatusResponse['data'] | null>(null);
  const [streakData, setStreakData] = useState<StreakResponse['data'] | null>(null);
  const [isLoadingMomentum, setIsLoadingMomentum] = useState(true);
  const [momentumError, setMomentumError] = useState<string | null>(null);

  // Section B: Insights & Value
  const [statsData, setStatsData] = useState<QuickStatsResponse['data'] | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Section C: Timeline History
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoadingCheckIns, setIsLoadingCheckIns] = useState(true);
  const [checkInsError, setCheckInsError] = useState<string | null>(null);

  // Fetch Section A: Status + Streak
  useEffect(() => {
    const fetchMomentumData = async () => {
      try {
        setIsLoadingMomentum(true);
        setMomentumError(null);

        const [statusResponse, streakResponse] = await Promise.all([
          checkInsApi.getStatus(),
          analysisApi.getStreak(),
        ]);

        if (statusResponse.success) {
          setStatusData(statusResponse.data);
        }
        if (streakResponse.success) {
          setStreakData(streakResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch momentum data:', error);
        setMomentumError('Failed to load daily status and streak data.');
      } finally {
        setIsLoadingMomentum(false);
      }
    };

    fetchMomentumData();
  }, []);

  // Fetch Section B: Quick Stats
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        setIsLoadingStats(true);
        setStatsError(null);

        const response = await analysisApi.getQuickStats(7);

        if (response.success) {
          setStatsData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats data:', error);
        setStatsError('Failed to load weekly insights.');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStatsData();
  }, []);

  // Fetch Section C: Check-ins
  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        setIsLoadingCheckIns(true);
        setCheckInsError(null);

        const response = await checkInsApi.getAll();

        if (response.success) {
          setCheckIns(response.data.checkIns);
        }
      } catch (error) {
        console.error('Failed to fetch check-ins:', error);
        setCheckInsError('Failed to load check-ins.');
      } finally {
        setIsLoadingCheckIns(false);
      }
    };

    fetchCheckIns();
  }, []);

  // Helper: Format date as "Today", "Yesterday", or "MMM DD"
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Helper: Group check-ins by date
  const groupCheckInsByDate = (checkIns: CheckIn[]): Record<string, CheckIn[]> => {
    const grouped: Record<string, CheckIn[]> = {};

    checkIns.forEach((checkIn) => {
      const dateLabel = formatDate(checkIn.timestamp);
      if (!grouped[dateLabel]) {
        grouped[dateLabel] = [];
      }
      grouped[dateLabel].push(checkIn);
    });

    return grouped;
  };

  // Helper: Get trend icon
  const getTrendIcon = (trend: 'improving' | 'worsening' | 'stable'): string => {
    if (trend === 'worsening') return '⬆️';
    if (trend === 'improving') return '⬇️';
    return '➡️';
  };

  // Helper: Get severity color
  const getSeverityColor = (avgSeverity: number | null): string => {
    if (avgSeverity === null) return 'text-gray-500';
    if (avgSeverity >= 8) return 'text-red-600';
    if (avgSeverity >= 4) return 'text-amber-600';
    return 'text-emerald-600';
  };

  // Helper: Format time string (HH:MM) to 12-hour format
  const formatTime = (timeString: string | null): string => {
    if (!timeString) return 'N/A';

    // Parse HH:MM format
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return timeString; // Return as-is if invalid format

    const hours = parseInt(match[1], 10);
    const minutes = match[2];

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${displayHours}:${minutes} ${period}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const groupedCheckIns = groupCheckInsByDate(checkIns);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Ask Annie</h1>
              <p className="text-indigo-100">Welcome, {user?.username}!</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/trends')} variant="secondary" size="small">
                Trends
              </Button>
              <Button onClick={handleLogout} variant="secondary" size="small">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Section A: Daily Momentum */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Daily Momentum</h2>

            {isLoadingMomentum && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            )}

            {momentumError && <Alert type="error">{momentumError}</Alert>}

            {!isLoadingMomentum && !momentumError && statusData && streakData && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Daily Check-In CTA */}
                <Card variant="default" className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Today&apos;s Check-In
                  </h3>

                  {statusData.today.isComplete ? (
                    <Alert type="success">All caught up for today!</Alert>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate('/checkin')}
                        variant="primary"
                        size="medium"
                        className="w-full"
                      >
                        Evening Check-In
                      </Button>
                      {statusData.today.nextSuggested && (
                        <p className="text-sm text-gray-600 text-center">
                          Next suggested: {formatTime(statusData.today.nextSuggested)}
                        </p>
                      )}
                    </div>
                  )}
                </Card>

                {/* Streak Info */}
                <Card variant="default" className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Progress
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-indigo-600">
                        {streakData.currentStreak}
                      </span>
                      <span className="text-2xl">🔥</span>
                      <span className="text-lg text-gray-700">Day Streak</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {streakData.activeDays} active days
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </section>

          {/* Latest Check-In Comparison Section */}
          {!isLoadingStats && !statsError && statsData?.latestCheckIn && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Latest Check-In vs. Your Averages</h2>
              <Card variant="default" className="p-6">
                <div className="space-y-4">
                  {statsData.latestCheckIn.symptoms.map((symptom) => {
                    const capitalizedName = symptom.name.charAt(0).toUpperCase() + symptom.name.slice(1);

                    // Determine indicator based on trend
                    let indicator = '';
                    let indicatorColor = '';
                    let trendText = '';

                    if (symptom.trend === 'above') {
                      indicator = '↑';
                      indicatorColor = 'text-red-600';
                      trendText = 'Above usual';
                    } else if (symptom.trend === 'below') {
                      indicator = '↓';
                      indicatorColor = 'text-green-600';
                      trendText = 'Below usual';
                    } else {
                      indicator = '≈';
                      indicatorColor = 'text-gray-600';
                      trendText = 'Normal';
                    }

                    return (
                      <div key={symptom.name} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">
                          {capitalizedName}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-700">
                              <span className="font-medium">Current:</span> {symptom.latestValue}
                            </span>
                            <span className="text-gray-500">|</span>
                            <span className="text-gray-700">
                              <span className="font-medium">Avg:</span> {symptom.averageValue.toFixed(1)}
                            </span>
                          </div>
                          <div className={`flex items-center gap-1.5 text-sm font-medium ${indicatorColor}`}>
                            <span className="text-lg" aria-hidden="true">{indicator}</span>
                            <span>{trendText}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          )}

          {/* Section B: Insights & Value */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Weekly Insights</h2>

            {isLoadingStats && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            )}

            {statsError && <Alert type="error">{statsError}</Alert>}

            {!isLoadingStats && !statsError && statsData && (
              <div className="grid gap-4 md:grid-cols-3">
                {/* Check-ins This Week */}
                <Card variant="default" className="p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Check-ins This Week
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {statsData.checkInCount.current}
                    </span>
                    {statsData.checkInCount.change !== 0 && (
                      <span className={`text-sm ${
                        statsData.checkInCount.change > 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}>
                        {statsData.checkInCount.change > 0 ? '⬆️' : '⬇️'}{' '}
                        {Math.abs(statsData.checkInCount.change)} vs last week
                      </span>
                    )}
                  </div>
                </Card>

                {/* Top Symptoms */}
                <Card variant="default" className="p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Top Symptoms
                  </h3>
                  <div className="space-y-2">
                    {statsData.topSymptoms.slice(0, 3).map((symptom) => {
                      const badgeVariant =
                        symptom.trend === 'improving'
                          ? 'success'
                          : symptom.trend === 'worsening'
                          ? 'error'
                          : 'warning';

                      return (
                        <div key={symptom.name} className="flex items-center justify-between">
                          <Badge variant={badgeVariant} size="small">
                            {symptom.name}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {getTrendIcon(symptom.trend)} {symptom.avgSeverity?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      );
                    })}
                    {statsData.topSymptoms.length === 0 && (
                      <p className="text-sm text-gray-500">No symptoms recorded</p>
                    )}
                  </div>
                </Card>

                {/* Average Severity */}
                <Card variant="default" className="p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Average Severity
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${getSeverityColor(statsData.averageSeverity.current)}`}>
                      {statsData.averageSeverity.current.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {getTrendIcon(statsData.averageSeverity.trend)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {statsData.averageSeverity.trend === 'improving'
                      ? 'Improving trend'
                      : statsData.averageSeverity.trend === 'worsening'
                      ? 'Worsening trend'
                      : 'Stable trend'}
                  </p>
                </Card>
              </div>
            )}
          </section>

          {/* Section C: Timeline History */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Timeline</h2>
              <Button onClick={() => navigate('/checkin')} variant="primary" size="small">
                + New Check-in
              </Button>
            </div>

            {isLoadingCheckIns && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Loading check-ins...</p>
              </div>
            )}

            {checkInsError && <Alert type="error">{checkInsError}</Alert>}

            {!isLoadingCheckIns && !checkInsError && checkIns.length === 0 && (
              <Card variant="default" className="p-12 text-center">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No check-ins yet</h3>
                <p className="mt-1 text-gray-500">
                  Get started by recording your first check-in.
                </p>
                <Button
                  onClick={() => navigate('/checkin')}
                  variant="primary"
                  size="small"
                  className="mt-6"
                >
                  Create your first check-in
                </Button>
              </Card>
            )}

            {!isLoadingCheckIns && !checkInsError && checkIns.length > 0 && (
              <div className="space-y-6">
                {Object.entries(groupedCheckIns).map(([dateLabel, dateCheckIns]) => (
                  <div key={dateLabel}>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                      {dateLabel}
                    </h3>
                    <div className="space-y-2">
                      {dateCheckIns.map((checkIn) => (
                        <CheckInCard key={checkIn._id} checkIn={checkIn} mode="compact" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
