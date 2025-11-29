/**
 * Milestones Module
 *
 * Handles check-in milestone calculations including
 * total counts, streaks, and milestone detection.
 */

import CheckIn from '../../models/CheckIn';
import { CheckInMilestones, MILESTONE_COUNTS } from './types';

/**
 * Get user's check-in milestones (total count, streak, milestone status)
 *
 * @param userId - The user's ID
 * @returns Milestone data including total check-ins, current streak, and milestone status
 */
export async function getCheckInMilestones(userId: string): Promise<CheckInMilestones> {
  const totalCheckIns = await CheckIn.countDocuments({ userId });

  // Calculate current streak
  const checkIns = await CheckIn.find({ userId })
    .select('timestamp')
    .sort({ timestamp: -1 })
    .lean();

  let currentStreak = 0;
  if (checkIns.length > 0) {
    const uniqueDates = new Set<string>();
    checkIns.forEach((checkIn) => {
      const date = checkIn.timestamp.toISOString().split('T')[0];
      uniqueDates.add(date);
    });

    const sortedDates = Array.from(uniqueDates).sort().reverse();

    // Start from yesterday (grace period)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const currentDate = new Date(yesterdayStr);

    for (const dateStr of sortedDates) {
      const checkInDate = new Date(dateStr);
      const expectedDateStr = currentDate.toISOString().split('T')[0];

      if (dateStr === expectedDateStr) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (checkInDate < currentDate) {
        break;
      }
    }
  }

  // Check if this is a milestone
  const isMilestone = MILESTONE_COUNTS.includes(totalCheckIns);
  const milestoneNumber = isMilestone ? totalCheckIns : undefined;

  return {
    totalCheckIns,
    currentStreak,
    isMilestone,
    milestoneNumber,
  };
}
