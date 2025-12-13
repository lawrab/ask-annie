import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { analysisApi } from '../services/api';
import type { SymptomStats, SymptomTrendResponse } from '../services/api';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { SymptomChart } from '../components/charts/SymptomChart';
import { QuickStatsCard } from '../components/dashboard/QuickStatsCard';
import { Header } from '../components/Header';
import { formatDisplayName } from '../utils/string';

export default function TrendsPage() {
  const navigate = useNavigate();

  // Symptoms list state
  const [symptoms, setSymptoms] = useState<SymptomStats[]>([]);
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(true);
  const [symptomsError, setSymptomsError] = useState<string | null>(null);

  // Trend data state
  const [selectedSymptom, setSelectedSymptom] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [trendData, setTrendData] = useState<SymptomTrendResponse['data'] | null>(null);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  // Fetch symptoms list on mount
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        setIsLoadingSymptoms(true);
        setSymptomsError(null);

        const response = await analysisApi.getSymptomsAnalysis();

        if (response.success && response.data.symptoms.length > 0) {
          setSymptoms(response.data.symptoms);
          // Auto-select the first symptom
          setSelectedSymptom(response.data.symptoms[0].name);
        } else {
          setSymptoms([]);
        }
      } catch (error) {
        console.error('Failed to fetch symptoms:', error);
        setSymptomsError('Failed to load symptoms list.');
      } finally {
        setIsLoadingSymptoms(false);
      }
    };

    fetchSymptoms();
  }, []);

  // Fetch trend data when symptom or days changes
  useEffect(() => {
    if (!selectedSymptom) return;

    const fetchTrendData = async () => {
      try {
        setIsLoadingTrend(true);
        setTrendError(null);

        const response = await analysisApi.getSymptomTrend(selectedSymptom, selectedDays);

        if (response.success) {
          setTrendData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch trend data:', error);
        setTrendError('Failed to load trend data.');
      } finally {
        setIsLoadingTrend(false);
      }
    };

    fetchTrendData();
  }, [selectedSymptom, selectedDays]);

  // Calculate trend direction
  const getTrendDirection = (): 'improving' | 'worsening' | 'stable' => {
    if (!trendData?.dataPoints || trendData.dataPoints.length < 2) return 'stable';

    const firstHalf = trendData.dataPoints.slice(0, Math.floor(trendData.dataPoints.length / 2));
    const secondHalf = trendData.dataPoints.slice(Math.floor(trendData.dataPoints.length / 2));

    const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    const threshold = 0.5;

    if (change < -threshold) return 'improving';
    if (change > threshold) return 'worsening';
    return 'stable';
  };

  // Calculate percentage of days with symptom
  const getPercentageDaysPresent = (): number => {
    if (!trendData?.dataPoints || selectedDays === 0) return 0;
    return (trendData.dataPoints.length / selectedDays) * 100;
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header currentPage="trends" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div>
            <h2 className="text-2xl font-bold text-walnut">Symptom Trends</h2>
            <p className="text-walnut-muted mt-1">
              Analyze your symptom patterns over time to identify trends and triggers
            </p>
          </div>

          {/* Loading State for Symptoms */}
          {isLoadingSymptoms && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
              <p className="mt-2 text-walnut-muted">Loading symptoms...</p>
            </div>
          )}

          {/* Error State for Symptoms */}
          {symptomsError && <Alert type="error">{symptomsError}</Alert>}

          {/* Empty State - No Symptoms */}
          {!isLoadingSymptoms && !symptomsError && symptoms.length === 0 && (
            <Card variant="default" className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-walnut-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-walnut">No symptoms tracked yet</h3>
              <p className="mt-1 text-walnut-muted">
                Start recording check-ins to see symptom trends and patterns.
              </p>
              <Button
                onClick={() => navigate('/checkin')}
                variant="primary"
                size="medium"
                className="mt-6"
              >
                Create your first check-in
              </Button>
            </Card>
          )}

          {/* Main Content - Symptoms Available */}
          {!isLoadingSymptoms && !symptomsError && symptoms.length > 0 && (
            <>
              {/* Filter Controls */}
              <Card variant="default" padding="default">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Symptom Selector */}
                  <div className="flex-1">
                    <label
                      htmlFor="symptom-select"
                      className="block text-sm font-medium text-walnut mb-1"
                    >
                      Symptom
                    </label>
                    <select
                      id="symptom-select"
                      value={selectedSymptom}
                      onChange={(e) => setSelectedSymptom(e.target.value)}
                      className="w-full px-3 py-2 border border-walnut-200 rounded-lg text-walnut focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                    >
                      {symptoms.map((symptom) => (
                        <option key={symptom.name} value={symptom.name}>
                          {formatDisplayName(symptom.name)} {symptom.average !== undefined ? `(avg: ${symptom.average.toFixed(1)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Range Selector */}
                  <div className="flex-1">
                    <label
                      htmlFor="days-select"
                      className="block text-sm font-medium text-walnut mb-1"
                    >
                      Time Range
                    </label>
                    <select
                      id="days-select"
                      value={selectedDays}
                      onChange={(e) => setSelectedDays(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-walnut-200 rounded-lg text-walnut focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                    >
                      <option value={7}>Last 7 days</option>
                      <option value={14}>Last 14 days</option>
                      <option value={30}>Last 30 days</option>
                      <option value={90}>Last 90 days</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Loading State for Trend */}
              {isLoadingTrend && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
                  <p className="mt-2 text-walnut-muted">Loading trend data...</p>
                </div>
              )}

              {/* Error State for Trend */}
              {trendError && <Alert type="error">{trendError}</Alert>}

              {/* Trend Chart */}
              {!isLoadingTrend && !trendError && trendData && (
                <>
                  <Card variant="default" padding="default">
                    <h3 className="text-lg font-semibold text-walnut mb-4">
                      {formatDisplayName(selectedSymptom)} - Severity Over Time
                    </h3>
                    <SymptomChart
                      data={trendData.dataPoints}
                      symptomName={formatDisplayName(selectedSymptom)}
                      dateRange={trendData.dateRange}
                      onDateClick={(date) => {
                        console.log('Clicked date:', date);
                        // Future: Navigate to that day's check-ins
                      }}
                    />
                  </Card>

                  {/* Statistics Cards */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <QuickStatsCard
                      label="Average Severity"
                      current={trendData.statistics.average}
                      previous={trendData.statistics.median}
                      format="number"
                    />

                    <Card variant="default" padding="default">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-walnut">
                          Severity Range
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-walnut">
                            {Math.round(trendData.statistics.min)} - {Math.round(trendData.statistics.max)}
                          </span>
                        </div>
                        <p className="text-xs text-walnut-muted">
                          Min to Max severity recorded
                        </p>
                      </div>
                    </Card>

                    <Card variant="default" padding="default">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-walnut">
                          Days Present
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-walnut">
                            {getPercentageDaysPresent().toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-walnut-muted">
                          {trendData.dataPoints.length} of {selectedDays} days
                        </p>
                      </div>
                    </Card>

                    <Card variant="default" padding="default">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-walnut">
                          Trend Direction
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`text-2xl font-bold ${
                              getTrendDirection() === 'improving'
                                ? 'text-sage'
                                : getTrendDirection() === 'worsening'
                                ? 'text-coral'
                                : 'text-walnut-muted'
                            }`}
                          >
                            {getTrendDirection() === 'improving' && '⬇️ Improving'}
                            {getTrendDirection() === 'worsening' && '⬆️ Worsening'}
                            {getTrendDirection() === 'stable' && '➡️ Stable'}
                          </span>
                        </div>
                        <p className="text-xs text-walnut-muted">
                          Based on recent data points
                        </p>
                      </div>
                    </Card>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
