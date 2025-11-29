/**
 * Trend Analysis Module
 *
 * Analyzes symptom trends over time to identify patterns
 * and calculate time-series statistics.
 */

import { Types } from 'mongoose';
import CheckIn, { ICheckIn } from '../../models/CheckIn';
import { TrendAnalysis, TrendDataPoint } from './types';
import {
  calculateNumericStats,
  calculateMedian,
  calculateStandardDeviation,
  formatDateKey,
} from './utils';

/**
 * Get symptom value from a check-in
 */
function getSymptomValue(checkIn: ICheckIn, symptomName: string): unknown {
  const symptoms = checkIn.structured?.symptoms;

  if (!symptoms || typeof symptoms !== 'object') {
    return undefined;
  }

  if (symptoms instanceof Map) {
    return symptoms.get(symptomName);
  }

  return symptoms[symptomName];
}

/**
 * Analyze trend data for a specific symptom over time
 *
 * Groups check-ins by date and calculates daily averages,
 * along with overall statistics for the period.
 *
 * @param userId - The user's ID
 * @param symptomName - Name of the symptom to analyze
 * @param days - Number of days to analyze (default: 14)
 * @returns Trend analysis with data points and statistics, or null if no data
 */
export async function analyzeTrendForSymptom(
  userId: string | Types.ObjectId,
  symptomName: string,
  days: number = 14
): Promise<TrendAnalysis | null> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const checkIns = await CheckIn.find({
    userId,
    timestamp: { $gte: startDate, $lte: endDate },
  }).sort({ timestamp: 1 });

  if (checkIns.length === 0) {
    return null;
  }

  // Group check-ins by date and extract symptom values
  const dateMap = new Map<string, number[]>();
  const allValues: number[] = [];

  checkIns.forEach((checkIn: ICheckIn) => {
    const value = getSymptomValue(checkIn, symptomName);

    if (typeof value === 'number' && !isNaN(value)) {
      const dateKey = formatDateKey(new Date(checkIn.timestamp));

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }

      dateMap.get(dateKey)!.push(value);
      allValues.push(value);
    }
  });

  if (allValues.length === 0) {
    return null;
  }

  // Calculate daily averages
  const dataPoints: TrendDataPoint[] = [];

  dateMap.forEach((values, date) => {
    const average =
      Math.round((values.reduce((acc, val) => acc + val, 0) / values.length) * 100) / 100;
    dataPoints.push({
      date,
      value: average,
      count: values.length,
    });
  });

  dataPoints.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate overall statistics
  const { min, max, average } = calculateNumericStats(allValues);
  const median = calculateMedian(allValues);
  const standardDeviation = calculateStandardDeviation(allValues, average);

  return {
    symptom: symptomName,
    dataPoints,
    statistics: {
      average,
      min,
      max,
      median,
      standardDeviation,
    },
  };
}
