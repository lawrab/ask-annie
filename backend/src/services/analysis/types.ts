/**
 * Analysis module type definitions
 *
 * Contains all interfaces and enums used across the analysis services.
 */

/**
 * Symptom value type classification
 */
export enum SymptomValueType {
  NUMERIC = 'numeric',
  CATEGORICAL = 'categorical',
  BOOLEAN = 'boolean',
}

/**
 * Statistics for a single symptom
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
 * Result of symptom analysis across all check-ins
 */
export interface SymptomsAnalysis {
  symptoms: SymptomStats[];
  totalCheckins: number;
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
 * Statistics calculated for trend analysis
 */
export interface TrendStatistics {
  average: number;
  min: number;
  max: number;
  median: number;
  standardDeviation: number;
}

/**
 * Complete trend analysis result for a symptom
 */
export interface TrendAnalysis {
  symptom: string;
  dateRange: {
    start: string;
    end: string;
  };
  dataPoints: TrendDataPoint[];
  statistics: TrendStatistics;
}

/**
 * Streak analysis result
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
 * Time period definition for comparison
 */
export interface TimePeriod {
  start: string;
  end: string;
  days: number;
}

/**
 * Check-in count comparison between periods
 */
export interface CheckInCountComparison {
  current: number;
  previous: number;
  change: number;
  percentChange: number;
}

/**
 * Top symptom summary with trend
 */
export interface TopSymptom {
  name: string;
  frequency: number;
  avgSeverity: number | null;
  trend: 'improving' | 'worsening' | 'stable';
}

/**
 * Average severity comparison between periods
 */
export interface AverageSeverityComparison {
  current: number;
  previous: number;
  change: number;
  trend: 'improving' | 'worsening' | 'stable';
}

/**
 * Comparison of latest check-in symptom to average
 */
export interface LatestSymptomComparison {
  name: string;
  latestValue: number;
  averageValue: number;
  trend: 'above' | 'below' | 'equal';
}

/**
 * Latest check-in data with symptom comparisons
 */
export interface LatestCheckInData {
  timestamp: Date;
  symptoms: LatestSymptomComparison[];
}

/**
 * Quick stats for week-over-week comparison
 */
export interface QuickStats {
  period: {
    current: TimePeriod;
    previous: TimePeriod;
  };
  checkInCount: CheckInCountComparison;
  topSymptoms: TopSymptom[];
  averageSeverity: AverageSeverityComparison;
  latestCheckIn?: LatestCheckInData;
}

/**
 * Symptom summary with aggregated statistics and time range
 */
export interface SymptomSummaryEntry {
  symptom: string;
  count: number;
  minSeverity: number;
  maxSeverity: number;
  avgSeverity: number;
  firstReported: string;
  lastReported: string;
  trend: 'improving' | 'worsening' | 'stable';
  frequency: number; // Percentage of days with this symptom
}

/**
 * Day quality classification
 */
export type DayQuality = 'good' | 'bad' | 'interpolated_good' | 'interpolated_bad';

/**
 * Day with quality classification
 */
export interface DayQualityEntry {
  date: string;
  quality: DayQuality;
  avgSeverity: number;
  maxSeverity: number;
  symptomCount: number;
  hasCheckIn: boolean;
}

/**
 * Analysis of good vs bad days over a period
 */
export interface GoodBadDayAnalysis {
  totalGoodDays: number;
  totalBadDays: number;
  avgTimeBetweenGoodDays: number;
  avgTimeBetweenBadDays: number;
  avgBadDayStreakLength: number;
  longestBadDayStreak: number;
  dailyQuality: DayQualityEntry[];
}

/**
 * Correlation between activities/triggers and symptoms
 */
export interface CorrelationEntry {
  item: string;
  itemType: 'activity' | 'trigger';
  symptom: string;
  coOccurrenceCount: number;
  totalItemOccurrences: number;
  correlationStrength: number; // 0-100 percentage
}

/**
 * Flagged check-in entry for doctor summary
 */
export interface FlaggedEntry {
  timestamp: string;
  symptoms: { [key: string]: { severity: number; location?: string; notes?: string } };
  activities: string[];
  triggers: string[];
  notes: string;
  rawTranscript: string;
}

/**
 * Complete doctor summary for a time period
 */
export interface DoctorSummary {
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  overview: {
    totalCheckins: number;
    flaggedCheckins: number;
    uniqueSymptoms: number;
    daysWithCheckins: number;
  };
  symptomSummary: SymptomSummaryEntry[];
  goodBadDayAnalysis: GoodBadDayAnalysis;
  correlations: CorrelationEntry[];
  flaggedEntries: FlaggedEntry[];
}
