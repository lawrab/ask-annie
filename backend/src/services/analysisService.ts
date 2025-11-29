/**
 * Analysis Service
 *
 * This file re-exports from the analysis module for backward compatibility.
 * New code should import directly from './analysis'.
 *
 * @deprecated Import from './analysis' instead
 */

export {
  // Types
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
  // Functions
  analyzeSymptomsForUser,
  analyzeTrendForSymptom,
  calculateStreak,
  calculateQuickStats,
} from './analysis';
