/**
 * Analysis Service Module
 *
 * Provides health data analysis functionality including:
 * - Symptom aggregation and statistics
 * - Trend analysis over time
 * - Check-in streak tracking
 * - Week-over-week comparisons
 * - Doctor summary reports
 */

// Re-export all types
export {
  SymptomValueType,
  SymptomStats,
  SymptomsAnalysis,
  TrendDataPoint,
  TrendStatistics,
  TrendAnalysis,
  StreakAnalysis,
  TimePeriod,
  CheckInCountComparison,
  TopSymptom,
  AverageSeverityComparison,
  LatestSymptomComparison,
  LatestCheckInData,
  QuickStats,
  SymptomSummaryEntry,
  DayQuality,
  DayQualityEntry,
  GoodBadDayAnalysis,
  CorrelationEntry,
  FlaggedEntry,
  DoctorSummary,
} from './types';

// Re-export analysis functions
export { analyzeSymptomsForUser } from './symptomAnalysis';
export { analyzeTrendForSymptom } from './trendAnalysis';
export { calculateStreak } from './streakAnalysis';
export { calculateQuickStats } from './quickStatsAnalysis';
export { generateDoctorSummary } from './summaryAnalysis';

// Re-export utility functions for testing and extension
export {
  calculateMedian,
  calculateStandardDeviation,
  calculateNumericStats,
  determineSymptomType,
  getUniqueValues,
  extractSeverity,
  formatDateKey,
} from './utils';
