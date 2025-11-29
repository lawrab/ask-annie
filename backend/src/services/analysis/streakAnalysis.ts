/**
 * Streak Analysis Module
 *
 * Calculates check-in streak statistics to help users
 * track their consistency in logging health data.
 */

import { Types } from 'mongoose';
import CheckIn from '../../models/CheckIn';
import { StreakAnalysis } from './types';
import { formatDateKey } from './utils';

/**
 * Calculate streak statistics for a user
 *
 * Analyzes check-in dates to determine:
 * - Current streak (consecutive days ending yesterday)
 * - Longest streak ever achieved
 * - Total active days and date range
 *
 * @param userId - The user's ID
 * @returns Streak statistics
 *
 * @todo Add .lean() for performance optimization (requires test mock updates)
 */
export async function calculateStreak(userId: string | Types.ObjectId): Promise<StreakAnalysis> {
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

  // Extract unique dates
  const uniqueDates = new Set<string>();
  checkIns.forEach((checkIn) => {
    const dateKey = formatDateKey(new Date(checkIn.timestamp));
    uniqueDates.add(dateKey);
  });

  const sortedDates = Array.from(uniqueDates).sort();
  const activeDays = sortedDates.length;

  // Calculate total days from first to last check-in
  const firstDate = new Date(sortedDates[0]);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  const totalDays =
    Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate current streak (start from yesterday for grace period)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak = 0;
  let streakStartDate: string | null = null;
  const checkDate = new Date(yesterday);

  // Work backwards from yesterday
  while (true) {
    const dateKey = formatDateKey(checkDate);
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
      tempStreak++;
    } else {
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
