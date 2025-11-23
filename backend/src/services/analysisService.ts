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
 * Data point for a single date in trend analysis
 */
export interface TrendDataPoint {
  date: string;
  value: number;
  count: number;
}

/**
 * Statistics for trend analysis
 */
export interface TrendStatistics {
  average: number;
  min: number;
  max: number;
  median: number;
  standardDeviation: number;
}

/**
 * Trend analysis result interface
 */
export interface TrendAnalysis {
  symptom: string;
  dataPoints: TrendDataPoint[];
  statistics: TrendStatistics;
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

    // Skip if symptoms is null or undefined
    if (!symptoms || typeof symptoms !== 'object') {
      return;
    }

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

/**
 * Calculate median of an array of numbers
 */
function calculateMedian(values: number[]): number {
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
function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length === 0) {
    return 0;
  }

  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

/**
 * Get symptom value from check-in
 */
function getSymptomValue(checkIn: ICheckIn, symptomName: string): unknown {
  const symptoms = checkIn.structured.symptoms;

  // Return undefined if symptoms is null or undefined
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
 */
export async function analyzeTrendForSymptom(
  userId: string | Types.ObjectId,
  symptomName: string,
  days: number = 14
): Promise<TrendAnalysis | null> {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch check-ins within the date range
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

    // Only process numeric values
    if (typeof value === 'number' && !isNaN(value)) {
      const dateKey = checkIn.timestamp.toISOString().split('T')[0];

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }

      dateMap.get(dateKey)!.push(value);
      allValues.push(value);
    }
  });

  // If no numeric values found, return null
  if (allValues.length === 0) {
    return null;
  }

  // Calculate daily averages and create data points
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

  // Sort data points by date
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

/**
 * Streak analysis result interface
 */
export interface StreakAnalysis {
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  totalDays: number;
  streakStartDate: string | null;
  lastLogDate: string | null;
}

/**
 * Calculate streak statistics for a user
 */
export async function calculateStreak(userId: string | Types.ObjectId): Promise<StreakAnalysis> {
  // Fetch all check-ins for the user
  const checkIns = await CheckIn.find({ userId }).sort({ timestamp: 1 }).select('timestamp').lean();

  if (checkIns.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      activeDays: 0,
      totalDays: 0,
      streakStartDate: null,
      lastLogDate: null,
    };
  }

  // Extract unique dates (YYYY-MM-DD format)
  const uniqueDates = new Set<string>();
  checkIns.forEach((checkIn) => {
    const dateKey = new Date(checkIn.timestamp).toISOString().split('T')[0];
    uniqueDates.add(dateKey);
  });

  const sortedDates = Array.from(uniqueDates).sort();
  const activeDays = sortedDates.length;

  // Calculate total days from first to last check-in
  const firstDate = new Date(sortedDates[0]);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  const totalDays =
    Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate current streak (start from yesterday to give grace period)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak = 0;
  let streakStartDate: string | null = null;
  const checkDate = yesterday;

  // Work backwards from yesterday
  while (true) {
    const dateKey = checkDate.toISOString().split('T')[0];
    if (sortedDates.includes(dateKey)) {
      currentStreak++;
      streakStartDate = dateKey;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Consecutive days
      tempStreak++;
    } else {
      // Streak broken
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    activeDays,
    totalDays,
    streakStartDate,
    lastLogDate: sortedDates[sortedDates.length - 1],
  };
}

/**
 * Time period interface
 */
export interface TimePeriod {
  start: string;
  end: string;
  days: number;
}

/**
 * Check-in count comparison interface
 */
export interface CheckInCountComparison {
  current: number;
  previous: number;
  change: number;
  percentChange: number;
}

/**
 * Top symptom interface
 */
export interface TopSymptom {
  name: string;
  frequency: number;
  avgSeverity: number | null;
  trend: 'improving' | 'worsening' | 'stable';
}

/**
 * Average severity comparison interface
 */
export interface AverageSeverityComparison {
  current: number;
  previous: number;
  change: number;
  trend: 'improving' | 'worsening' | 'stable';
}

/**
 * Quick stats analysis interface
 */
export interface QuickStats {
  period: {
    current: TimePeriod;
    previous: TimePeriod;
  };
  checkInCount: CheckInCountComparison;
  topSymptoms: TopSymptom[];
  averageSeverity: AverageSeverityComparison;
}

/**
 * Calculate quick statistics for week-over-week comparison
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

  // Aggregate symptoms from current period
  const currentSymptomMap = new Map<string, number[]>();
  currentCheckIns.forEach((checkIn) => {
    const symptoms = checkIn.structured.symptoms;

    // Skip if symptoms is null or undefined
    if (!symptoms || typeof symptoms !== 'object') {
      return;
    }

    const entries = symptoms instanceof Map ? symptoms.entries() : Object.entries(symptoms);

    for (const [key, value] of entries) {
      let severity: number | null = null;

      // Handle SymptomValue object format: { severity: number, location?: string, notes?: string }
      if (value && typeof value === 'object' && 'severity' in value) {
        severity = (value as { severity: number }).severity;
      }

      // Only process valid numeric severities
      if (typeof severity === 'number' && !isNaN(severity)) {
        if (!currentSymptomMap.has(key)) {
          currentSymptomMap.set(key, []);
        }
        currentSymptomMap.get(key)!.push(severity);
      }
    }
  });

  // Aggregate symptoms from previous period
  const previousSymptomMap = new Map<string, number[]>();
  previousCheckIns.forEach((checkIn) => {
    const symptoms = checkIn.structured.symptoms;

    // Skip if symptoms is null or undefined
    if (!symptoms || typeof symptoms !== 'object') {
      return;
    }

    const entries = symptoms instanceof Map ? symptoms.entries() : Object.entries(symptoms);

    for (const [key, value] of entries) {
      let severity: number | null = null;

      // Handle SymptomValue object format: { severity: number, location?: string, notes?: string }
      if (value && typeof value === 'object' && 'severity' in value) {
        severity = (value as { severity: number }).severity;
      }

      // Only process valid numeric severities
      if (typeof severity === 'number' && !isNaN(severity)) {
        if (!previousSymptomMap.has(key)) {
          previousSymptomMap.set(key, []);
        }
        previousSymptomMap.get(key)!.push(severity);
      }
    }
  });

  // Calculate top symptoms
  const topSymptoms: TopSymptom[] = [];
  currentSymptomMap.forEach((values, name) => {
    const frequency = values.length;
    const avgSeverity = Math.round((values.reduce((a, b) => a + b, 0) / frequency) * 100) / 100;

    // Calculate previous avg severity for trend
    const previousValues = previousSymptomMap.get(name);
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';

    if (previousValues && previousValues.length > 0) {
      const previousAvg = previousValues.reduce((a, b) => a + b, 0) / previousValues.length;
      const severityChange = ((avgSeverity - previousAvg) / previousAvg) * 100;

      if (severityChange < -10) {
        trend = 'improving'; // Severity decreased
      } else if (severityChange > 10) {
        trend = 'worsening'; // Severity increased
      }
    }

    topSymptoms.push({
      name,
      frequency,
      avgSeverity,
      trend,
    });
  });

  // Sort by frequency and take top 5
  topSymptoms.sort((a, b) => b.frequency - a.frequency);
  const top5Symptoms = topSymptoms.slice(0, 5);

  // Calculate average severity across all symptoms
  let currentTotalSeverity = 0;
  let currentSeverityCount = 0;
  currentSymptomMap.forEach((values) => {
    currentTotalSeverity += values.reduce((a, b) => a + b, 0);
    currentSeverityCount += values.length;
  });

  let previousTotalSeverity = 0;
  let previousSeverityCount = 0;
  previousSymptomMap.forEach((values) => {
    previousTotalSeverity += values.reduce((a, b) => a + b, 0);
    previousSeverityCount += values.length;
  });

  const currentAvgSeverity =
    currentSeverityCount > 0
      ? Math.round((currentTotalSeverity / currentSeverityCount) * 100) / 100
      : 0;

  const previousAvgSeverity =
    previousSeverityCount > 0
      ? Math.round((previousTotalSeverity / previousSeverityCount) * 100) / 100
      : 0;

  const severityChange = Math.round((currentAvgSeverity - previousAvgSeverity) * 100) / 100;

  let severityTrend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (previousAvgSeverity > 0) {
    const percentChange = ((currentAvgSeverity - previousAvgSeverity) / previousAvgSeverity) * 100;
    if (percentChange < -10) {
      severityTrend = 'improving';
    } else if (percentChange > 10) {
      severityTrend = 'worsening';
    }
  }

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
    topSymptoms: top5Symptoms,
    averageSeverity: {
      current: currentAvgSeverity,
      previous: previousAvgSeverity,
      change: severityChange,
      trend: severityTrend,
    },
  };
}
