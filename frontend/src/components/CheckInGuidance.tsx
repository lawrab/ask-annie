import { useEffect, useState } from 'react';
import { checkInsApi, CheckInContext } from '../services/api';
import { Button } from './ui/Button';

interface CheckInGuidanceProps {
  className?: string;
  onStartRecording?: () => void;
  isRecording?: boolean;
}

/**
 * Pre-check-in guidance panel showing personalized context to help users
 * provide comprehensive and consistent check-ins with proper severity scoring.
 */
export default function CheckInGuidance({
  className = '',
  onStartRecording,
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
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span role="img" aria-label="clipboard">📋</span>
          Your Check-In Guide
        </h3>
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
                <div className="flex flex-wrap gap-2">
                  {context.lastCheckIn.symptoms.map((symptom) => (
                    <span
                      key={symptom.name}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100"
                    >
                      {symptom.name} <span className="ml-1 text-blue-500">{symptom.severity}/10</span>
                    </span>
                  ))}
                </div>
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
                  {context.recentSymptoms.map((symptom) => (
                    <span
                      key={symptom.name}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getTrendStyles(symptom.trend)}`}
                    >
                      {symptom.name}
                      <span className="ml-1.5">{getTrendIcon(symptom.trend)}</span>
                    </span>
                  ))}
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

        {/* Quick Check-in Button */}
        {onStartRecording && (
          <Button
            onClick={onStartRecording}
            variant="primary"
            size="large"
            fullWidth
            disabled={isRecording}
            className="mt-2"
          >
            <span className="flex items-center justify-center gap-2">
              {isRecording ? (
                <>
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  Recording...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Start Voice Check-in
                </>
              )}
            </span>
          </Button>
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
    <div className="space-y-3">
      <p className="text-sm text-gray-600 flex items-center gap-2">
        <span role="img" aria-label="wave">👋</span>
        <span className="font-medium">Welcome! Here&apos;s what to include:</span>
      </p>
      <ul className="text-sm text-gray-600 space-y-2 ml-1">
        <li className="flex items-start gap-2">
          <span className="text-indigo-500 mt-0.5">•</span>
          Symptoms you&apos;re experiencing
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo-500 mt-0.5">•</span>
          <span>Rate each symptom <strong>1-10</strong> (1 = mild, 10 = severe)</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo-500 mt-0.5">•</span>
          Any activities or triggers
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo-500 mt-0.5">•</span>
          How you&apos;re feeling overall
        </li>
      </ul>
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
