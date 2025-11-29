/**
 * Insight Service
 *
 * This file re-exports from the insight module for backward compatibility.
 * New code should import directly from './insight'.
 *
 * @deprecated Import from './insight' instead
 */

export {
  // Types
  CheckInMilestones,
  MILESTONE_COUNTS,
  SIGNIFICANT_DIFFERENCE_THRESHOLD,
  // Functions
  getCheckInMilestones,
  calculateSymptomAverage,
  generateDataContextCard,
  generateValidationCard,
  generatePostCheckInInsight,
} from './insight';
