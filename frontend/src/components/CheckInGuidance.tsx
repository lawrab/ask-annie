import { useEffect, useState } from 'react';
import { checkInsApi, CheckInContext } from '../services/api';
import { Button } from './ui/Button';

interface CheckInGuidanceProps {
  className?: string;
  onStartRecording?: () => void;
  onStartManual?: () => void;
  isRecording?: boolean;
}

/**
 * Pre-check-in guidance panel showing personalized context to help users
 * provide comprehensive and consistent check-ins with proper severity scoring.
 */
export default function CheckInGuidance({
  className = '',
  onStartRecording,
  onStartManual,
  isRecording = false,
}: CheckInGuidanceProps) {
  const [context, setContext] = useState<CheckInContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        setIsLoading(true);
        const response = await checkInsApi.getContext();
        if (response.success) {
          setContext(response.data);
        }
      } catch (err) {
        setError('Unable to load guidance');
        console.error('Failed to fetch check-in context:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContext();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded-full w-24"></div>
            <div className="h-8 bg-gray-200 rounded-full w-20"></div>
            <div className="h-8 bg-gray-200 rounded-full w-28"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - show generic guidance instead
  if (error || !context) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <NewUserGuidance />
      </div>
    );
  }

  // Check if user has history
  const hasHistory = context.lastCheckIn || context.recentSymptoms.length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {/* Header with Action Buttons */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span role="img" aria-label="clipboard">📋</span>
            Your Check-In Guide
          </h3>
          {(onStartRecording || onStartManual) && (
            <div className="flex gap-2">
              {onStartRecording && (
                <button
                  onClick={onStartRecording}
                  disabled={isRecording}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isRecording
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg'
                  } disabled:opacity-50`}
                >
                  <span className="flex items-center gap-1.5">
                    {isRecording ? (
                      <>
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Start Voice Check-in
                      </>
                    )}
                  </span>
                </button>
              )}
              {onStartManual && (
                <Button
                  onClick={onStartManual}
                  variant="secondary"
                  size="small"
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Manual
                  </span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {hasHistory ? (
          <>
            {/* Last Check-In Context */}
            {context.lastCheckIn && (
              <div>
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-1.5">
                  <span role="img" aria-label="pin">📍</span>
                  <span className="font-medium">Last check-in</span>
                  <span className="text-gray-400">({context.lastCheckIn.timeAgo}):</span>
                </p>
                {context.lastCheckIn.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {context.lastCheckIn.symptoms.slice(0, 5).map((symptom) => (
                      <span
                        key={symptom.name}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        {symptom.name} <span className="ml-1 text-blue-500">{symptom.severity}/10</span>
                      </span>
                    ))}
                    {context.lastCheckIn.symptoms.length > 5 && (
                      <span className="text-sm text-gray-400">
                        +{context.lastCheckIn.symptoms.length - 5} more
                      </span>
                    )}
                  </div>
                )}
                {context.lastCheckIn.notes && (
                  <p className="text-sm text-gray-500 italic">
                    &ldquo;{context.lastCheckIn.notes}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Recent Symptoms with Trends */}
            {context.recentSymptoms.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-1.5">
                  <span role="img" aria-label="chart">📊</span>
                  <span className="font-medium">Your symptoms to update:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {context.recentSymptoms.slice(0, 5).map((symptom) => (
                    <span
                      key={symptom.name}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getTrendStyles(symptom.trend)}`}
                    >
                      {symptom.name}
                      <span className="ml-1.5">{getTrendIcon(symptom.trend)}</span>
                    </span>
                  ))}
                  {context.recentSymptoms.length > 5 && (
                    <span className="text-sm text-gray-400">
                      +{context.recentSymptoms.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <NewUserGuidance />
        )}

        {/* Scoring Reminder - Always visible */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-1">
            <span role="img" aria-label="star">⭐</span>
            Rate each symptom 1-10
          </p>
          <p className="text-xs text-amber-700 ml-6">
            1 = barely noticeable → 10 = most severe
          </p>
        </div>

        {/* Streak Motivation */}
        {context.streak.current >= 3 && context.streak.message && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span role="img" aria-label="fire" className="text-lg">🔥</span>
            <span className="font-medium">{context.streak.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Guidance content shown for new users without check-in history
 */
function NewUserGuidance() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-700 flex items-center gap-2 font-medium">
          <span role="img" aria-label="wave">👋</span>
          Welcome to your first check-in!
        </p>
        <p className="text-sm text-gray-500 mt-1">
          The easiest way is to tap <strong>&quot;Start Voice Check-in&quot;</strong> and simply talk about how you&apos;re feeling.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Example</p>
        <p className="text-sm text-gray-600 italic">
          &quot;I have a headache, about a 6 out of 10. Also feeling some fatigue, maybe a 4. I didn&apos;t sleep well last night and skipped breakfast.&quot;
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tips for better tracking</p>
        <ul className="text-sm text-gray-600 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            <span>Rate symptoms <strong>1-10</strong> so we can track changes over time</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            Mention activities, food, sleep, or stress that might be related
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            Check in daily for the best insights
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Get trend indicator icon
 */
function getTrendIcon(trend: 'improving' | 'worsening' | 'stable'): string {
  switch (trend) {
    case 'improving':
      return '↓';
    case 'worsening':
      return '↑';
    case 'stable':
    default:
      return '→';
  }
}

/**
 * Get Tailwind classes for trend styling
 */
function getTrendStyles(trend: 'improving' | 'worsening' | 'stable'): string {
  switch (trend) {
    case 'improving':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'worsening':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'stable':
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}
