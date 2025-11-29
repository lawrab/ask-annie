/**
 * Analysis Service Module
 *
 * Provides health data analysis functionality including:
 * - Symptom aggregation and statistics
 * - Trend analysis over time
 * - Check-in streak tracking
 * - Week-over-week comparisons
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
} from './types';

// Re-export analysis functions
export { analyzeSymptomsForUser } from './symptomAnalysis';
export { analyzeTrendForSymptom } from './trendAnalysis';
export { calculateStreak } from './streakAnalysis';
export { calculateQuickStats } from './quickStatsAnalysis';

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
