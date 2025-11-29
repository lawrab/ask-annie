/**
 * Data Context Module
 *
 * Generates data context insight cards by comparing
 * current check-in data to historical averages.
 */

import CheckIn, { ICheckIn } from '../../models/CheckIn';
import { InsightCard } from '../../types';
import { TIME_WINDOWS } from '../../constants';
import { SIGNIFICANT_DIFFERENCE_THRESHOLD } from './types';
import { getCheckInMilestones } from './milestones';

/**
 * Calculate average severity for a specific symptom over a time period
 *
 * @param userId - The user's ID
 * @param symptomName - Name of the symptom to analyze
 * @param days - Number of days to look back
 * @returns Average severity or null if no data
 */
export async function calculateSymptomAverage(
  userId: string,
  symptomName: string,
  days: number
): Promise<number | null> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const checkIns = await CheckIn.find({
    userId,
    timestamp: { $gte: startDate },
  })
    .select('structured.symptoms')
    .lean();

  const severities: number[] = [];

  checkIns.forEach((checkIn) => {
    const symptoms = checkIn.structured?.symptoms;
    if (!symptoms) return;

    // Handle both Map and plain object
    const symptomValue =
      symptoms instanceof Map ? symptoms.get(symptomName) : symptoms[symptomName];

    if (symptomValue && typeof symptomValue === 'object' && 'severity' in symptomValue) {
      const severity = Number(symptomValue.severity);
      if (!isNaN(severity)) {
        severities.push(severity);
      }
    }
  });

  if (severities.length === 0) return null;

  const sum = severities.reduce((acc, val) => acc + val, 0);
  return sum / severities.length;
}

/**
 * Generate a data context card comparing current check-in to historical data
 *
 * @param userId - The user's ID
 * @param checkIn - The current check-in document
 * @returns Data context insight card or null if no significant comparison found
 */
export async function generateDataContextCard(
  userId: string,
  checkIn: ICheckIn
): Promise<InsightCard | null> {
  const symptoms = checkIn.structured?.symptoms;
  if (!symptoms) return null;

  // Get all symptoms from current check-in
  const symptomEntries: Array<[string, { severity: number }]> = [];

  if (symptoms instanceof Map) {
    symptoms.forEach((value, key) => {
      if (value && typeof value === 'object' && 'severity' in value) {
        symptomEntries.push([key, value]);
      }
    });
  } else {
    Object.entries(symptoms).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'severity' in value) {
        symptomEntries.push([key, value]);
      }
    });
  }

  if (symptomEntries.length === 0) return null;

  // Try to find a significant comparison for any symptom
  for (const [symptomName, symptomValue] of symptomEntries) {
    const currentSeverity = Number(symptomValue.severity);
    if (isNaN(currentSeverity)) continue;

    // Compare to 14-day average
    const average = await calculateSymptomAverage(
      userId,
      symptomName,
      TIME_WINDOWS.TWO_WEEK_AVERAGE_DAYS
    );

    if (average !== null) {
      const difference = Math.abs(currentSeverity - average);
      const percentDiff = difference / average;

      // If significantly different, create insight
      if (percentDiff >= SIGNIFICANT_DIFFERENCE_THRESHOLD) {
        const isBetter = currentSeverity < average;
        const direction = isBetter ? 'below' : 'above';
        const sentiment = isBetter
          ? "you're trending better than usual"
          : "that's higher than usual";

        return {
          type: 'data_context',
          title: "Today's Context",
          message: `Your ${symptomName} (${currentSeverity}/10) is ${direction} your 2-week average of ${average.toFixed(1)}.\n${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}.`,
          icon: '\u{1F4CA}',
          metadata: {
            symptomName,
            currentValue: currentSeverity,
            averageValue: average,
            percentDifference: percentDiff,
            isBetter,
          },
        };
      }
    }
  }

  // Fallback: streak or milestone info
  const milestones = await getCheckInMilestones(userId);

  if (milestones.currentStreak >= TIME_WINDOWS.MIN_STREAK_FOR_INSIGHT) {
    return {
      type: 'data_context',
      title: 'Consistency Win',
      message: `You've now checked in ${milestones.currentStreak} days in a row.\nPatterns emerge from commitment like this.`,
      icon: '\u{1F4CA}',
      metadata: {
        streakLength: milestones.currentStreak,
      },
    };
  }

  return null;
}
