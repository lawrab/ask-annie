import { useEffect, useState } from 'react';
import { checkInsApi, analysisApi } from '../services/api';
import type { QuickStatsResponse, CheckIn } from '../services/api';
import { Alert } from '../components/ui/Alert';
import { Header } from '../components/Header';
import { HealthSummary } from '../components/HealthSummary';
import { LatestVsAverage } from '../components/LatestVsAverage';
import { CheckInCTA } from '../components/CheckInCTA';
import { RecentCheckIns } from '../components/RecentCheckIns';

const RECENT_CHECKINS_LIMIT = 5;

export default function DashboardPage() {
  // Health summary data
  const [statsData, setStatsData] = useState<QuickStatsResponse['data'] | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Recent check-ins
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoadingCheckIns, setIsLoadingCheckIns] = useState(true);
  const [checkInsError, setCheckInsError] = useState<string | null>(null);

  // Fetch quick stats for health summary
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
        setStatsError('Failed to load health summary.');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStatsData();
  }, []);

  // Fetch recent check-ins (limit + 1 to know if there are more)
  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        setIsLoadingCheckIns(true);
        setCheckInsError(null);

        const response = await checkInsApi.getAll({ limit: RECENT_CHECKINS_LIMIT + 1 });

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

  // Get last check-in time
  const lastCheckInTime = checkIns.length > 0 ? checkIns[0].timestamp : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Two-column layout on desktop, single column on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Primary focus */}
            <div className="space-y-6">
              {/* Check-in CTA - Primary action */}
              <CheckInCTA
                lastCheckInTime={lastCheckInTime}
                isLoading={isLoadingCheckIns}
              />

              {/* Health Summary - "How am I doing?" */}
              {statsError && <Alert type="error">{statsError}</Alert>}

              {!statsError && (
                <HealthSummary
                  averageSeverity={statsData?.averageSeverity.current ?? 0}
                  trend={statsData?.averageSeverity.trend ?? 'stable'}
                  topSymptoms={statsData?.topSymptoms ?? []}
                  isLoading={isLoadingStats}
                />
              )}
            </div>

            {/* Right Column - Context & History */}
            <div className="space-y-6">
              {/* Latest vs Average comparison */}
              {!statsError && statsData?.latestCheckIn && (
                <LatestVsAverage
                  symptoms={statsData.latestCheckIn.symptoms}
                  isLoading={isLoadingStats}
                />
              )}

              {/* Recent Check-ins */}
              {checkInsError && <Alert type="error">{checkInsError}</Alert>}

              {!checkInsError && (
                <RecentCheckIns
                  checkIns={checkIns}
                  limit={RECENT_CHECKINS_LIMIT}
                  isLoading={isLoadingCheckIns}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
