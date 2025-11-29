/**
 * Analysis utility functions
 *
 * Pure calculation helpers used across analysis modules.
 */

import { SymptomValueType } from './types';

/**
 * Calculate median of an array of numbers
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }
  return sorted[mid];
}

/**
 * Calculate standard deviation of an array of numbers
 */
export function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length === 0) {
    return 0;
  }

  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

/**
 * Calculate min, max, and average for numeric values
 */
export function calculateNumericStats(values: number[]): {
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
  const average = Math.round((sum / validValues.length) * 100) / 100;

  return { min, max, average };
}

/**
 * Determine the type of a symptom based on its values
 */
export function determineSymptomType(values: unknown[]): SymptomValueType {
  const validValues = values.filter((v) => v !== null && v !== undefined);

  if (validValues.length === 0) {
    return SymptomValueType.CATEGORICAL;
  }

  const allBoolean = validValues.every((v) => typeof v === 'boolean');
  if (allBoolean) {
    return SymptomValueType.BOOLEAN;
  }

  const allNumeric = validValues.every((v) => typeof v === 'number' && !isNaN(v as number));
  if (allNumeric) {
    return SymptomValueType.NUMERIC;
  }

  return SymptomValueType.CATEGORICAL;
}

/**
 * Get unique values from an array, filtering out null/undefined
 */
export function getUniqueValues(values: unknown[]): unknown[] {
  const validValues = values.filter((v) => v !== null && v !== undefined);
  return Array.from(new Set(validValues));
}

/**
 * Extract severity from a symptom value object
 * Handles both direct numeric values and SymptomValue objects
 */
export function extractSeverity(value: unknown): number | null {
  if (value && typeof value === 'object' && 'severity' in value) {
    const severity = (value as { severity: number }).severity;
    if (typeof severity === 'number' && !isNaN(severity)) {
      return severity;
    }
  }
  return null;
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}
