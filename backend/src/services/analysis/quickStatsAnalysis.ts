/**
 * Quick Stats Analysis Module
 *
 * Provides week-over-week comparison statistics for the dashboard,
 * including check-in counts, top symptoms, and severity trends.
 */

import { Types } from 'mongoose';
import CheckIn, { ICheckIn } from '../../models/CheckIn';
import { QuickStats, TopSymptom, LatestCheckInData, LatestSymptomComparison } from './types';
import { extractSeverity } from './utils';

/**
 * Aggregate symptoms from check-ins into a map of symptom name to severity values
 */
function aggregateSymptomsFromCheckIns(checkIns: ICheckIn[]): Map<string, number[]> {
  const symptomMap = new Map<string, number[]>();

  checkIns.forEach((checkIn) => {
    const symptoms = checkIn.structured.symptoms;

    if (!symptoms || typeof symptoms !== 'object') {
      return;
    }

    const entries = symptoms instanceof Map ? symptoms.entries() : Object.entries(symptoms);

    for (const [key, value] of entries) {
      const severity = extractSeverity(value);

      if (severity !== null) {
        if (!symptomMap.has(key)) {
          symptomMap.set(key, []);
        }
        symptomMap.get(key)!.push(severity);
      }
    }
  });

  return symptomMap;
}

/**
 * Calculate top symptoms with trends
 */
function calculateTopSymptoms(
  currentSymptomMap: Map<string, number[]>,
  previousSymptomMap: Map<string, number[]>,
  limit: number = 5
): TopSymptom[] {
  const topSymptoms: TopSymptom[] = [];

  currentSymptomMap.forEach((values, name) => {
    const frequency = values.length;
    const avgSeverity = Math.round((values.reduce((a, b) => a + b, 0) / frequency) * 100) / 100;

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

    topSymptoms.push({
      name,
      frequency,
      avgSeverity,
      trend,
    });
  });

  topSymptoms.sort((a, b) => b.frequency - a.frequency);
  return topSymptoms.slice(0, limit);
}

/**
 * Calculate average severity across all symptoms
 */
function calculateOverallSeverity(symptomMap: Map<string, number[]>): {
  total: number;
  count: number;
  average: number;
} {
  let total = 0;
  let count = 0;

  symptomMap.forEach((values) => {
    total += values.reduce((a, b) => a + b, 0);
    count += values.length;
  });

  const average = count > 0 ? Math.round((total / count) * 100) / 100 : 0;

  return { total, count, average };
}

/**
 * Build latest check-in comparison data
 */
function buildLatestCheckInData(
  checkIns: ICheckIn[],
  currentSymptomMap: Map<string, number[]>
): LatestCheckInData | undefined {
  if (checkIns.length === 0) {
    return undefined;
  }

  const sortedCheckIns = [...checkIns].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latestCheckInDoc = sortedCheckIns[0];
  const latestSymptoms = latestCheckInDoc.structured.symptoms;

  if (!latestSymptoms || typeof latestSymptoms !== 'object') {
    return undefined;
  }

  const latestSymptomComparisons: LatestSymptomComparison[] = [];
  const entries =
    latestSymptoms instanceof Map ? latestSymptoms.entries() : Object.entries(latestSymptoms);

  for (const [symptomName, value] of entries) {
    const latestSeverity = extractSeverity(value);

    if (latestSeverity !== null) {
      const symptomValues = currentSymptomMap.get(symptomName);
      if (symptomValues && symptomValues.length > 0) {
        const averageValue =
          Math.round((symptomValues.reduce((a, b) => a + b, 0) / symptomValues.length) * 10) / 10;

        let trend: 'above' | 'below' | 'equal' = 'equal';
        const difference = latestSeverity - averageValue;

        if (difference > 0.5) {
          trend = 'above';
        } else if (difference < -0.5) {
          trend = 'below';
        }

        latestSymptomComparisons.push({
          name: symptomName,
          latestValue: latestSeverity,
          averageValue,
          trend,
        });
      }
    }
  }

  if (latestSymptomComparisons.length === 0) {
    return undefined;
  }

  return {
    timestamp: latestCheckInDoc.timestamp,
    symptoms: latestSymptomComparisons,
  };
}

/**
 * Calculate quick statistics for week-over-week comparison
 *
 * Compares current period to previous period of same length,
 * analyzing check-in frequency, symptom trends, and severity changes.
 *
 * @param userId - The user's ID
 * @param days - Number of days for each period (default: 7)
 * @returns Quick stats with period comparison
 */
export async function calculateQuickStats(
  userId: string | Types.ObjectId,
  days: number = 7
): Promise<QuickStats> {
  // Calculate date ranges
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const currentStartDate = new Date(endDate);
  currentStartDate.setDate(currentStartDate.getDate() - days + 1);
  currentStartDate.setHours(0, 0, 0, 0);

  const previousEndDate = new Date(currentStartDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  previousEndDate.setHours(23, 59, 59, 999);

  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - days + 1);
  previousStartDate.setHours(0, 0, 0, 0);

  // Fetch check-ins for both periods
  // @todo Add .lean() for performance optimization (requires test mock updates)
  const currentCheckIns = await CheckIn.find({
    userId,
    timestamp: { $gte: currentStartDate, $lte: endDate },
  });

  const previousCheckIns = await CheckIn.find({
    userId,
    timestamp: { $gte: previousStartDate, $lte: previousEndDate },
  });

  // Calculate check-in count comparison
  const currentCount = currentCheckIns.length;
  const previousCount = previousCheckIns.length;
  const checkInChange = currentCount - previousCount;
  const checkInPercentChange =
    previousCount > 0 ? Math.round((checkInChange / previousCount) * 1000) / 10 : 0;

  // Aggregate symptoms
  const currentSymptomMap = aggregateSymptomsFromCheckIns(currentCheckIns);
  const previousSymptomMap = aggregateSymptomsFromCheckIns(previousCheckIns);

  // Calculate top symptoms with trends
  const topSymptoms = calculateTopSymptoms(currentSymptomMap, previousSymptomMap);

  // Calculate overall severity comparison
  const currentSeverity = calculateOverallSeverity(currentSymptomMap);
  const previousSeverity = calculateOverallSeverity(previousSymptomMap);

  const severityChange =
    Math.round((currentSeverity.average - previousSeverity.average) * 100) / 100;

  let severityTrend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (previousSeverity.average > 0) {
    const percentChange =
      ((currentSeverity.average - previousSeverity.average) / previousSeverity.average) * 100;
    if (percentChange < -10) {
      severityTrend = 'improving';
    } else if (percentChange > 10) {
      severityTrend = 'worsening';
    }
  }

  // Build latest check-in comparison
  const latestCheckIn = buildLatestCheckInData(currentCheckIns, currentSymptomMap);

  return {
    period: {
      current: {
        start: currentStartDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days,
      },
      previous: {
        start: previousStartDate.toISOString().split('T')[0],
        end: previousEndDate.toISOString().split('T')[0],
        days,
      },
    },
    checkInCount: {
      current: currentCount,
      previous: previousCount,
      change: checkInChange,
      percentChange: checkInPercentChange,
    },
    topSymptoms,
    averageSeverity: {
      current: currentSeverity.average,
      previous: previousSeverity.average,
      change: severityChange,
      trend: severityTrend,
    },
    latestCheckIn,
  };
}
