/**
 * Symptom Analysis Module
 *
 * Analyzes symptoms across all user check-ins to provide
 * aggregated statistics and insights.
 */

import { Types } from 'mongoose';
import CheckIn, { ICheckIn } from '../../models/CheckIn';
import { SymptomsAnalysis, SymptomStats, SymptomValueType } from './types';
import { determineSymptomType, calculateNumericStats, getUniqueValues } from './utils';

/**
 * Analyze symptoms from all user check-ins
 *
 * Aggregates symptom data across all check-ins to calculate:
 * - Frequency of each symptom
 * - Percentage of check-ins containing each symptom
 * - Min/max/average for numeric symptoms
 * - Unique values for categorical symptoms
 *
 * @param userId - The user's ID
 * @returns Aggregated symptom statistics
 *
 * @todo Add .lean() for performance optimization (requires test mock updates)
 */
export async function analyzeSymptomsForUser(
  userId: string | Types.ObjectId
): Promise<SymptomsAnalysis> {
  const checkIns = await CheckIn.find({ userId }).sort({ timestamp: -1 });

  const totalCheckins = checkIns.length;

  if (totalCheckins === 0) {
    return {
      symptoms: [],
      totalCheckins: 0,
    };
  }

  // Aggregate symptoms across all check-ins
  const symptomMap = new Map<string, unknown[]>();

  checkIns.forEach((checkIn: ICheckIn) => {
    const symptoms = checkIn.structured?.symptoms;

    if (!symptoms || typeof symptoms !== 'object') {
      return;
    }

    if (symptoms instanceof Map) {
      symptoms.forEach((value, key) => {
        if (!symptomMap.has(key)) {
          symptomMap.set(key, []);
        }
        symptomMap.get(key)!.push(value);
      });
    } else {
      Object.entries(symptoms).forEach(([key, value]) => {
        if (!symptomMap.has(key)) {
          symptomMap.set(key, []);
        }
        symptomMap.get(key)!.push(value);
      });
    }
  });

  // Calculate statistics for each symptom
  const symptoms: SymptomStats[] = [];

  symptomMap.forEach((values, name) => {
    const count = values.length;
    const percentage = Math.round((count / totalCheckins) * 1000) / 10;
    const type = determineSymptomType(values);

    const stat: SymptomStats = {
      name,
      count,
      percentage,
      type,
    };

    if (type === SymptomValueType.NUMERIC) {
      const numericValues = values as number[];
      const { min, max, average } = calculateNumericStats(numericValues);
      stat.min = min;
      stat.max = max;
      stat.average = average;
    } else if (type === SymptomValueType.CATEGORICAL) {
      stat.values = getUniqueValues(values);
    }

    symptoms.push(stat);
  });

  // Sort by frequency (most frequent first)
  symptoms.sort((a, b) => b.count - a.count);

  return {
    symptoms,
    totalCheckins,
  };
}
