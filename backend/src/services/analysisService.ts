import CheckIn, { ICheckIn } from '../models/CheckIn';
import { Types } from 'mongoose';

/**
 * Symptom value type enum
 */
export enum SymptomValueType {
  NUMERIC = 'numeric',
  CATEGORICAL = 'categorical',
  BOOLEAN = 'boolean',
}

/**
 * Symptom statistics interface
 */
export interface SymptomStats {
  name: string;
  count: number;
  percentage: number;
  type: SymptomValueType;
  min?: number;
  max?: number;
  average?: number;
  values?: unknown[];
}

/**
 * Symptoms analysis result interface
 */
export interface SymptomsAnalysis {
  symptoms: SymptomStats[];
  totalCheckins: number;
}

/**
 * Determine the type of a symptom based on its values
 */
function determineSymptomType(values: unknown[]): SymptomValueType {
  // Filter out null/undefined
  const validValues = values.filter((v) => v !== null && v !== undefined);

  if (validValues.length === 0) {
    return SymptomValueType.CATEGORICAL;
  }

  // Check if all values are boolean
  const allBoolean = validValues.every((v) => typeof v === 'boolean');
  if (allBoolean) {
    return SymptomValueType.BOOLEAN;
  }

  // Check if all values are numeric
  const allNumeric = validValues.every((v) => typeof v === 'number' && !isNaN(v as number));
  if (allNumeric) {
    return SymptomValueType.NUMERIC;
  }

  // Otherwise, categorical
  return SymptomValueType.CATEGORICAL;
}

/**
 * Calculate statistics for numeric symptoms
 */
function calculateNumericStats(values: number[]): {
  min: number;
  max: number;
  average: number;
} {
  const validValues = values.filter((v) => !isNaN(v));

  if (validValues.length === 0) {
    return { min: 0, max: 0, average: 0 };
  }

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  const average = Math.round((sum / validValues.length) * 100) / 100; // Round to 2 decimals

  return { min, max, average };
}

/**
 * Get unique categorical values
 */
function getUniqueValues(values: unknown[]): unknown[] {
  const validValues = values.filter((v) => v !== null && v !== undefined);
  return Array.from(new Set(validValues));
}

/**
 * Analyze symptoms from user's check-ins
 */
export async function analyzeSymptomsForUser(
  userId: string | Types.ObjectId
): Promise<SymptomsAnalysis> {
  // Fetch all check-ins for the user
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
    const symptoms = checkIn.structured.symptoms;

    // Convert Map to entries if needed
    if (symptoms instanceof Map) {
      symptoms.forEach((value, key) => {
        if (!symptomMap.has(key)) {
          symptomMap.set(key, []);
        }
        symptomMap.get(key)!.push(value);
      });
    } else {
      // Handle plain object
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
    const percentage = Math.round((count / totalCheckins) * 1000) / 10; // Round to 1 decimal
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

  // Sort by count (most frequent first)
  symptoms.sort((a, b) => b.count - a.count);

  return {
    symptoms,
    totalCheckins,
  };
}
