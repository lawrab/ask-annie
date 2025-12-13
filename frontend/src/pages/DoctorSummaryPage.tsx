import { useEffect, useState, useCallback } from 'react';
import { analysisApi } from '../services/api';
import type { DoctorSummary } from '../services/api';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { Header } from '../components/Header';
import { formatDisplayName } from '../utils/string';

export default function DoctorSummaryPage() {
  // Date range state
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filter state
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // Summary data state
  const [summary, setSummary] = useState<DoctorSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await analysisApi.getDoctorSummary(startDate, endDate, flaggedOnly);

      if (response.success) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctor summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load doctor summary.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, flaggedOnly]);

  // Fetch on mount and when filters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchSummary();
    }
  }, [startDate, endDate, flaggedOnly, fetchSummary]);

  // Export to clipboard
  const handleCopyToClipboard = () => {
    if (!summary) return;

    const text = formatSummaryAsText(summary);
    navigator.clipboard.writeText(text);
    alert('Summary copied to clipboard!');
  };

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-cream print:bg-white">
      <Header currentPage="summary" />

      <main className="container mx-auto px-4 py-8 print:px-0 print:py-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="print:hidden">
            <h2 className="text-2xl font-bold text-walnut">Doctor Summary Report</h2>
            <p className="text-walnut-muted mt-1">
              Comprehensive health report for your doctor visit
            </p>
          </div>

          {/* Filter Controls */}
          <Card variant="default" padding="default" className="print:hidden">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-walnut mb-1">
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                    className="w-full px-3 py-2 border border-walnut-200 rounded-lg text-walnut focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-walnut mb-1">
                    End Date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-walnut-200 rounded-lg text-walnut focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                  />
                </div>
              </div>

              {/* Flagged Only Toggle */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="flagged-only"
                  checked={flaggedOnly}
                  onChange={(e) => setFlaggedOnly(e.target.checked)}
                />
                <label htmlFor="flagged-only" className="text-sm text-walnut cursor-pointer">
                  Show only flagged entries
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleCopyToClipboard} variant="secondary" size="small" disabled={!summary}>
                  Copy to Clipboard
                </Button>
                <Button onClick={handlePrint} variant="secondary" size="small" disabled={!summary}>
                  Print Report
                </Button>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
              <p className="mt-2 text-walnut-muted">Generating summary...</p>
            </div>
          )}

          {/* Error State */}
          {error && <Alert type="error">{error}</Alert>}

          {/* Summary Content */}
          {!isLoading && !error && summary && (
            <>
              {/* Print Header */}
              <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold text-walnut">Health Summary Report</h1>
                <p className="text-sm text-walnut-muted mt-1">
                  Period: {new Date(summary.period.startDate).toLocaleDateString()} -{' '}
                  {new Date(summary.period.endDate).toLocaleDateString()}
                </p>
              </div>

              {/* Overview Section */}
              <Card variant="default" padding="default">
                <h3 className="text-lg font-semibold text-walnut mb-4">Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-walnut-muted">Period</p>
                    <p className="text-xl font-semibold text-walnut">{summary.period.totalDays} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-walnut-muted">Total Check-ins</p>
                    <p className="text-xl font-semibold text-walnut">{summary.overview.totalCheckins}</p>
                  </div>
                  <div>
                    <p className="text-sm text-walnut-muted">Unique Symptoms</p>
                    <p className="text-xl font-semibold text-walnut">{summary.overview.uniqueSymptoms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-walnut-muted">Flagged Entries</p>
                    <p className="text-xl font-semibold text-coral">{summary.overview.flaggedCheckins}</p>
                  </div>
                </div>
              </Card>

              {/* Symptom Summary Section */}
              <Card variant="default" padding="default">
                <h3 className="text-lg font-semibold text-walnut mb-4">Symptom Summary</h3>
                {summary.symptomSummary.length === 0 ? (
                  <p className="text-walnut-muted text-center py-8">No symptoms recorded in this period</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-walnut-200">
                        <tr className="text-left">
                          <th className="pb-2 font-semibold text-walnut">Symptom</th>
                          <th className="pb-2 font-semibold text-walnut text-center">Frequency</th>
                          <th className="pb-2 font-semibold text-walnut text-center">Avg Severity</th>
                          <th className="pb-2 font-semibold text-walnut text-center">Range</th>
                          <th className="pb-2 font-semibold text-walnut text-center">Trend</th>
                          <th className="pb-2 font-semibold text-walnut">First / Last</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.symptomSummary.map((symptom, idx) => (
                          <tr key={symptom.symptom} className={idx % 2 === 0 ? 'bg-cream' : ''}>
                            <td className="py-2 text-walnut font-medium">
                              {formatDisplayName(symptom.symptom)}
                            </td>
                            <td className="py-2 text-center text-walnut">
                              {symptom.frequency.toFixed(1)}%
                            </td>
                            <td className="py-2 text-center text-walnut">
                              {symptom.avgSeverity.toFixed(1)}
                            </td>
                            <td className="py-2 text-center text-walnut">
                              {Math.round(symptom.minSeverity)} - {Math.round(symptom.maxSeverity)}
                            </td>
                            <td className="py-2 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                  symptom.trend === 'improving'
                                    ? 'bg-sage-light text-sage'
                                    : symptom.trend === 'worsening'
                                    ? 'bg-coral-light text-coral'
                                    : 'bg-walnut-light text-walnut-muted'
                                }`}
                              >
                                {symptom.trend === 'improving' && '↓ Improving'}
                                {symptom.trend === 'worsening' && '↑ Worsening'}
                                {symptom.trend === 'stable' && '→ Stable'}
                              </span>
                            </td>
                            <td className="py-2 text-xs text-walnut-muted">
                              {symptom.firstReported} / {symptom.lastReported}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Good vs Bad Days Section */}
              <Card variant="default" padding="default">
                <h3 className="text-lg font-semibold text-walnut mb-4">Good vs Bad Days</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-walnut-muted">Good Days</p>
                    <p className="text-xl font-semibold text-sage">
                      {summary.goodBadDayAnalysis.totalGoodDays}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-walnut-muted">Bad Days</p>
                    <p className="text-xl font-semibold text-coral">
                      {summary.goodBadDayAnalysis.totalBadDays}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-walnut-muted">Good Days Pattern</p>
                    <p className="text-xl font-semibold text-walnut">
                      1 every {summary.goodBadDayAnalysis.avgTimeBetweenGoodDays.toFixed(1)}
                    </p>
                    <p className="text-xs text-walnut-muted">days</p>
                  </div>
                  <div>
                    <p className="text-sm text-walnut-muted">Bad Days Pattern</p>
                    <p className="text-xl font-semibold text-walnut">
                      1 every {summary.goodBadDayAnalysis.avgTimeBetweenBadDays.toFixed(1)}
                    </p>
                    <p className="text-xs text-walnut-muted">days</p>
                  </div>
                  <div>
                    <p className="text-sm text-walnut-muted">Avg Bad Streak</p>
                    <p className="text-xl font-semibold text-walnut">
                      {summary.goodBadDayAnalysis.avgBadDayStreakLength.toFixed(1)} days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-walnut-muted">Longest Streak</p>
                    <p className="text-xl font-semibold text-coral">
                      {summary.goodBadDayAnalysis.longestBadDayStreak} days
                    </p>
                  </div>
                </div>

                {/* Daily Quality Activity View (GitHub-style) */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-walnut mb-3">Daily Quality</h4>

                  <div className="overflow-x-auto">
                    <div className="inline-flex flex-col gap-1">
                      {/* Month labels */}
                      <div className="flex gap-1 ml-6 mb-1">
                        {(() => {
                          const days = summary.goodBadDayAnalysis.dailyQuality;
                          const monthLabels: JSX.Element[] = [];
                          let currentMonth = '';
                          let weekIndex = 0;

                          days.forEach((day, idx) => {
                            const date = new Date(day.date);
                            const month = date.toLocaleDateString('en-US', { month: 'short' });
                            const dayOfWeek = date.getDay();

                            if (dayOfWeek === 0 || idx === 0) {
                              if (month !== currentMonth) {
                                monthLabels.push(
                                  <div
                                    key={`month-${weekIndex}`}
                                    className="text-xs text-walnut-muted"
                                    style={{ width: '12px', textAlign: 'center' }}
                                  >
                                    {month}
                                  </div>
                                );
                                currentMonth = month;
                              } else {
                                monthLabels.push(
                                  <div key={`month-${weekIndex}`} style={{ width: '12px' }} />
                                );
                              }
                              weekIndex++;
                            }
                          });

                          return monthLabels;
                        })()}
                      </div>

                      {/* Grid: 7 rows (days of week) x N columns (weeks) */}
                      <div className="flex gap-1">
                        {/* Day labels */}
                        <div className="flex flex-col gap-1 text-xs text-walnut-muted justify-around pr-1">
                          <div style={{ height: '12px' }}>Sun</div>
                          <div style={{ height: '12px' }}>Mon</div>
                          <div style={{ height: '12px' }}>Tue</div>
                          <div style={{ height: '12px' }}>Wed</div>
                          <div style={{ height: '12px' }}>Thu</div>
                          <div style={{ height: '12px' }}>Fri</div>
                          <div style={{ height: '12px' }}>Sat</div>
                        </div>

                        {/* Activity grid */}
                        <div className="flex gap-1">
                          {(() => {
                            const days = summary.goodBadDayAnalysis.dailyQuality;
                            const firstDate = new Date(days[0].date);
                            const firstDayOfWeek = firstDate.getDay();

                            // Organize days into weeks
                            const weeks: (typeof days[0] | null)[][] = [[]];
                            let currentWeek = 0;

                            // Add empty cells for days before the first date
                            for (let i = 0; i < firstDayOfWeek; i++) {
                              weeks[currentWeek].push(null);
                            }

                            // Add all days
                            days.forEach((day) => {
                              const date = new Date(day.date);
                              const dayOfWeek = date.getDay();

                              if (dayOfWeek === 0 && weeks[currentWeek].length > 0) {
                                currentWeek++;
                                weeks[currentWeek] = [];
                              }

                              weeks[currentWeek].push(day);
                            });

                            // Fill the last week with empty cells if needed
                            while (weeks[currentWeek].length < 7) {
                              weeks[currentWeek].push(null);
                            }

                            // Render weeks as columns
                            return weeks.map((week, weekIdx) => (
                              <div key={`week-${weekIdx}`} className="flex flex-col gap-1">
                                {week.map((day, dayIdx) => {
                                  if (!day) {
                                    return (
                                      <div
                                        key={`empty-${weekIdx}-${dayIdx}`}
                                        className="w-3 h-3 rounded-sm"
                                        style={{ width: '12px', height: '12px' }}
                                      />
                                    );
                                  }

                                  const date = new Date(day.date);
                                  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
                                    date.getDay()
                                  ];

                                  return (
                                    <div
                                      key={day.date}
                                      className={`w-3 h-3 rounded-sm border cursor-help transition-transform hover:scale-125 ${
                                        day.quality.includes('good')
                                          ? day.hasCheckIn
                                            ? 'bg-sage border-sage'
                                            : 'bg-sage-light border-sage-light'
                                          : day.quality.includes('bad')
                                          ? day.hasCheckIn
                                            ? 'bg-coral border-coral'
                                            : 'bg-coral-light border-coral-light'
                                          : 'bg-gray-200 border-gray-300'
                                      }`}
                                      style={{ width: '12px', height: '12px' }}
                                      title={`${dayOfWeek}, ${date.toLocaleDateString()}\n${day.quality.replace('_', ' ')} day${day.hasCheckIn ? '\n✓ Check-in recorded' : '\n(interpolated)'}${day.hasCheckIn ? `\nAvg severity: ${day.avgSeverity.toFixed(1)}` : ''}`}
                                    />
                                  );
                                })}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-sage border-sage border"></div>
                      <span className="text-walnut-muted">Good day (check-in)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-sage-light border-sage-light border"></div>
                      <span className="text-walnut-muted">Good day (interpolated)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-coral border-coral border"></div>
                      <span className="text-walnut-muted">Bad day (check-in)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-coral-light border-coral-light border"></div>
                      <span className="text-walnut-muted">Bad day (interpolated)</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Correlations Section */}
              {summary.correlations.length > 0 && (
                <Card variant="default" padding="default">
                  <h3 className="text-lg font-semibold text-walnut mb-4">Correlations</h3>
                  <div className="space-y-3">
                    {summary.correlations.map((corr, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-cream rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-walnut">
                            <span className="capitalize">{corr.itemType}</span>:{' '}
                            <span className="text-terracotta">{formatDisplayName(corr.item)}</span>
                            {' → '}
                            <span className="text-coral">{formatDisplayName(corr.symptom)}</span>
                          </p>
                          <p className="text-xs text-walnut-muted mt-1">
                            Co-occurred {corr.coOccurrenceCount} times out of {corr.totalItemOccurrences}{' '}
                            occurrences
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-terracotta text-white">
                            {corr.correlationStrength}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Flagged Entries Section */}
              {summary.flaggedEntries.length > 0 && (
                <Card variant="default" padding="default">
                  <h3 className="text-lg font-semibold text-walnut mb-4">
                    Priority Flagged Entries ({summary.flaggedEntries.length})
                  </h3>
                  <div className="space-y-4">
                    {summary.flaggedEntries.map((entry, idx) => (
                      <div key={idx} className="p-4 bg-coral-light border border-coral rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-semibold text-coral">
                            {new Date(entry.timestamp).toLocaleDateString()} at{' '}
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </p>
                        </div>

                        {/* Symptoms */}
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-walnut mb-1">Symptoms:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(entry.symptoms).map(([name, value]) => (
                              <span
                                key={name}
                                className="inline-flex items-center px-2 py-1 bg-white rounded text-xs"
                              >
                                <span className="font-medium text-walnut">{formatDisplayName(name)}</span>
                                <span className="ml-1 text-coral font-semibold">({Math.round(value.severity)}/10)</span>
                                {value.location && (
                                  <span className="ml-1 text-walnut-muted">- {value.location}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Activities */}
                        {entry.activities.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-walnut mb-1">Activities:</p>
                            <p className="text-xs text-walnut">{entry.activities.join(', ')}</p>
                          </div>
                        )}

                        {/* Triggers */}
                        {entry.triggers.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-walnut mb-1">Triggers:</p>
                            <p className="text-xs text-walnut">{entry.triggers.join(', ')}</p>
                          </div>
                        )}

                        {/* Notes */}
                        {entry.notes && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-walnut mb-1">Notes:</p>
                            <p className="text-xs text-walnut">{entry.notes}</p>
                          </div>
                        )}

                        {/* Raw Transcript */}
                        {entry.rawTranscript && (
                          <div>
                            <p className="text-xs font-semibold text-walnut mb-1">Transcript:</p>
                            <p className="text-xs text-walnut-muted italic">{entry.rawTranscript}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && !error && !summary && (
            <Card variant="default" className="p-12 text-center">
              <p className="text-walnut-muted">Select a date range to generate a doctor summary report</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper function to format summary as plain text for clipboard
function formatSummaryAsText(summary: DoctorSummary): string {
  const lines: string[] = [];

  lines.push('HEALTH SUMMARY REPORT');
  lines.push('='.repeat(50));
  lines.push('');
  lines.push(
    `Period: ${new Date(summary.period.startDate).toLocaleDateString()} - ${new Date(summary.period.endDate).toLocaleDateString()}`
  );
  lines.push(`Total Days: ${summary.period.totalDays}`);
  lines.push('');

  lines.push('OVERVIEW');
  lines.push('-'.repeat(50));
  lines.push(`Total Check-ins: ${summary.overview.totalCheckins}`);
  lines.push(`Unique Symptoms: ${summary.overview.uniqueSymptoms}`);
  lines.push(`Flagged Entries: ${summary.overview.flaggedCheckins}`);
  lines.push('');

  lines.push('SYMPTOM SUMMARY');
  lines.push('-'.repeat(50));
  summary.symptomSummary.forEach((s) => {
    lines.push(
      `${formatDisplayName(s.symptom)}: ${s.frequency.toFixed(1)}% frequency, Avg: ${s.avgSeverity.toFixed(1)}, Range: ${Math.round(s.minSeverity)}-${Math.round(s.maxSeverity)}, Trend: ${s.trend}`
    );
  });
  lines.push('');

  lines.push('GOOD VS BAD DAYS');
  lines.push('-'.repeat(50));
  lines.push(`Good Days: ${summary.goodBadDayAnalysis.totalGoodDays}`);
  lines.push(`Bad Days: ${summary.goodBadDayAnalysis.totalBadDays}`);
  lines.push(`Good Days Pattern: 1 every ${summary.goodBadDayAnalysis.avgTimeBetweenGoodDays.toFixed(1)} days`);
  lines.push(`Bad Days Pattern: 1 every ${summary.goodBadDayAnalysis.avgTimeBetweenBadDays.toFixed(1)} days`);
  lines.push(
    `Avg Bad Day Streak: ${summary.goodBadDayAnalysis.avgBadDayStreakLength.toFixed(1)} days`
  );
  lines.push(`Longest Bad Day Streak: ${summary.goodBadDayAnalysis.longestBadDayStreak} days`);
  lines.push('');

  if (summary.correlations.length > 0) {
    lines.push('CORRELATIONS');
    lines.push('-'.repeat(50));
    summary.correlations.forEach((c) => {
      lines.push(
        `${c.itemType}: ${formatDisplayName(c.item)} → ${formatDisplayName(c.symptom)} (${c.correlationStrength}% correlation)`
      );
    });
    lines.push('');
  }

  if (summary.flaggedEntries.length > 0) {
    lines.push(`FLAGGED ENTRIES (${summary.flaggedEntries.length})`);
    lines.push('-'.repeat(50));
    summary.flaggedEntries.forEach((e, idx) => {
      lines.push(`${idx + 1}. ${new Date(e.timestamp).toLocaleString()}`);
      lines.push(
        `   Symptoms: ${Object.entries(e.symptoms)
          .map(([n, v]) => `${formatDisplayName(n)} (${v.severity}/10)`)
          .join(', ')}`
      );
      if (e.notes) lines.push(`   Notes: ${e.notes}`);
      lines.push('');
    });
  }

  return lines.join('\n');
}
