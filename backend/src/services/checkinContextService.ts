/**
 * Check-In Context Service
 *
 * Provides pre-check-in context to help users provide
 * comprehensive and consistent check-ins with proper severity scoring.
 */

import { Types } from 'mongoose';
import CheckIn, { ICheckIn } from '../models/CheckIn';
import { calculateStreak } from './analysis/streakAnalysis';
import { extractSeverity } from './analysis/utils';

/**
 * Symptom from the last check-in
 */
export interface LastCheckInSymptom {
  name: string;
  severity: number;
}

/**
 * Recent symptom with trend information
 */
export interface RecentSymptom {
  name: string;
  frequency: number;
  avgSeverity: number;
  trend: 'improving' | 'worsening' | 'stable';
}

/**
 * Streak information for motivation
 */
export interface StreakInfo {
  current: number;
  message?: string;
}

/**
 * Complete check-in context response
 */
export interface CheckInContext {
  lastCheckIn?: {
    timestamp: string;
    timeAgo: string;
    symptoms: LastCheckInSymptom[];
  };
  recentSymptoms: RecentSymptom[];
  streak: StreakInfo;
  suggestedTopics: string[];
}

/**
 * Format a relative time string (e.g., "12 hours ago", "2 days ago")
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else {
    return `${diffDays} days ago`;
  }
}

/**
 * Extract symptoms with severity from a check-in
 */
function extractSymptomsFromCheckIn(checkIn: ICheckIn): LastCheckInSymptom[] {
  const symptoms: LastCheckInSymptom[] = [];
  const checkInSymptoms = checkIn.structured?.symptoms;

  if (!checkInSymptoms || typeof checkInSymptoms !== 'object') {
    return symptoms;
  }

  const entries =
    checkInSymptoms instanceof Map ? checkInSymptoms.entries() : Object.entries(checkInSymptoms);

  for (const [name, value] of entries) {
    const severity = extractSeverity(value);
    if (severity !== null) {
      symptoms.push({ name, severity });
    }
  }

  // Sort by severity descending
  symptoms.sort((a, b) => b.severity - a.severity);
  return symptoms;
}

/**
 * Calculate recent symptoms with trends (last 7 days vs previous 7 days)
 */
async function calculateRecentSymptoms(
  userId: string | Types.ObjectId,
  limit: number = 5
): Promise<RecentSymptom[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Get check-ins for current and previous periods
  const [currentCheckIns, previousCheckIns] = await Promise.all([
    CheckIn.find({
      userId,
      timestamp: { $gte: sevenDaysAgo, $lte: now },
    }),
    CheckIn.find({
      userId,
      timestamp: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
    }),
  ]);

  // Aggregate symptoms from current period
  const currentSymptomMap = new Map<string, number[]>();
  currentCheckIns.forEach((checkIn) => {
    const symptoms = checkIn.structured?.symptoms;
    if (!symptoms || typeof symptoms !== 'object') return;

    const entries = symptoms instanceof Map ? symptoms.entries() : Object.entries(symptoms);
    for (const [name, value] of entries) {
      const severity = extractSeverity(value);
      if (severity !== null) {
        if (!currentSymptomMap.has(name)) {
          currentSymptomMap.set(name, []);
        }
        currentSymptomMap.get(name)!.push(severity);
      }
    }
  });

  // Aggregate symptoms from previous period
  const previousSymptomMap = new Map<string, number[]>();
  previousCheckIns.forEach((checkIn) => {
    const symptoms = checkIn.structured?.symptoms;
    if (!symptoms || typeof symptoms !== 'object') return;

    const entries = symptoms instanceof Map ? symptoms.entries() : Object.entries(symptoms);
    for (const [name, value] of entries) {
      const severity = extractSeverity(value);
      if (severity !== null) {
        if (!previousSymptomMap.has(name)) {
          previousSymptomMap.set(name, []);
        }
        previousSymptomMap.get(name)!.push(severity);
      }
    }
  });

  // Calculate trends
  const recentSymptoms: RecentSymptom[] = [];
  currentSymptomMap.forEach((values, name) => {
    const frequency = values.length;
    const avgSeverity = Math.round((values.reduce((a, b) => a + b, 0) / frequency) * 10) / 10;

    const previousValues = previousSymptomMap.get(name);
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';

    if (previousValues && previousValues.length > 0) {
      const previousAvg = previousValues.reduce((a, b) => a + b, 0) / previousValues.length;
      const severityChange = ((avgSeverity - previousAvg) / previousAvg) * 100;

      if (severityChange < -10) {
        trend = 'improving';
      } else if (severityChange > 10) {
        trend = 'worsening';
      }
    }

    recentSymptoms.push({ name, frequency, avgSeverity, trend });
  });

  // Sort by frequency and limit
  recentSymptoms.sort((a, b) => b.frequency - a.frequency);
  return recentSymptoms.slice(0, limit);
}

/**
 * Generate streak motivation message
 */
function generateStreakMessage(currentStreak: number): string | undefined {
  if (currentStreak < 3) {
    return undefined;
  }
  if (currentStreak >= 30) {
    return `${currentStreak}-day streak! Incredible dedication!`;
  }
  if (currentStreak >= 14) {
    return `${currentStreak}-day streak! Amazing consistency!`;
  }
  if (currentStreak >= 7) {
    return `${currentStreak}-day streak! You're on a roll!`;
  }
  return `${currentStreak}-day streak! Keep it going!`;
}

/**
 * Get suggested topics based on user history
 */
function getSuggestedTopics(recentSymptoms: RecentSymptom[]): string[] {
  const topics: string[] = [];

  // Always suggest rating symptoms
  topics.push('Rate symptoms 1-10');

  // Suggest common topics
  if (recentSymptoms.length > 0) {
    topics.push('Activities today');
    topics.push('Any triggers');
  } else {
    // New user suggestions
    topics.push("How you're feeling");
    topics.push('Activities');
    topics.push('Triggers');
  }

  return topics;
}

/**
 * Get pre-check-in context for a user
 *
 * Aggregates:
 * - Last check-in summary with symptoms
 * - Recent symptoms with trends
 * - Streak information
 * - Suggested topics
 *
 * @param userId - The user's ID
 * @returns Check-in context for guidance panel
 */
export async function getCheckInContext(userId: string | Types.ObjectId): Promise<CheckInContext> {
  // Fetch data in parallel
  const [lastCheckIn, recentSymptoms, streakData] = await Promise.all([
    CheckIn.findOne({ userId }).sort({ timestamp: -1 }),
    calculateRecentSymptoms(userId),
    calculateStreak(userId),
  ]);

  // Build last check-in context
  let lastCheckInContext: CheckInContext['lastCheckIn'] | undefined;
  if (lastCheckIn) {
    const symptoms = extractSymptomsFromCheckIn(lastCheckIn);
    if (symptoms.length > 0) {
      lastCheckInContext = {
        timestamp: lastCheckIn.timestamp.toISOString(),
        timeAgo: formatTimeAgo(new Date(lastCheckIn.timestamp)),
        symptoms,
      };
    }
  }

  // Build streak context
  const streak: StreakInfo = {
    current: streakData.currentStreak,
    message: generateStreakMessage(streakData.currentStreak),
  };

  // Build suggested topics
  const suggestedTopics = getSuggestedTopics(recentSymptoms);

  return {
    lastCheckIn: lastCheckInContext,
    recentSymptoms,
    streak,
    suggestedTopics,
  };
}
