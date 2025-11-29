/**
 * Insight Module Types and Constants
 *
 * Shared types and configuration for insight generation.
 */

/**
 * Milestone check-in counts that trigger special validation messages
 */
export const MILESTONE_COUNTS = [5, 10, 20, 30, 50, 100];

/**
 * Minimum percentage difference to consider a symptom significantly different from average
 */
export const SIGNIFICANT_DIFFERENCE_THRESHOLD = 0.2; // 20%

/**
 * Interface for check-in milestone data
 */
export interface CheckInMilestones {
  totalCheckIns: number;
  currentStreak: number;
  isMilestone: boolean;
  milestoneNumber?: number;
}
