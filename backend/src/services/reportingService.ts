/**
 * Reporting Service Module
 *
 * Provides user registration and check-in statistics for admin reporting
 * and individual user stats.
 */

import { Types } from 'mongoose';
import User from '../models/User';
import CheckIn from '../models/CheckIn';

/**
 * User statistics interface
 */
export interface UserStats {
  userId: string;
  username: string;
  email: string;
  checkInCount: number;
  lastCheckIn: Date | null;
  registeredAt: Date;
}

/**
 * System-wide statistics interface
 */
export interface SystemStats {
  totalUsers: number;
  totalCheckIns: number;
  users: UserStats[];
}

/**
 * Individual user statistics interface
 */
export interface IndividualUserStats {
  userId: string;
  username: string;
  email: string;
  checkInCount: number;
  lastCheckIn: Date | null;
  registeredAt: Date;
  firstCheckIn: Date | null;
}

/**
 * Get statistics for all users in the system (admin only)
 *
 * Returns comprehensive statistics including user count, total check-ins,
 * and detailed stats for each user.
 *
 * @returns System-wide statistics with all user data
 */
export async function getAllUsersStats(): Promise<SystemStats> {
  // Get all users
  const users = await User.find().sort({ createdAt: -1 }).lean();

  // Get check-in statistics for all users using aggregation
  const checkInStats = await CheckIn.aggregate([
    {
      $group: {
        _id: '$userId',
        count: { $sum: 1 },
        lastCheckIn: { $max: '$timestamp' },
      },
    },
  ]);

  // Create a map of userId to check-in stats for quick lookup
  const statsMap = new Map(
    checkInStats.map((stat) => [
      stat._id.toString(),
      { count: stat.count, lastCheckIn: stat.lastCheckIn },
    ])
  );

  // Combine user data with check-in stats
  const userStats: UserStats[] = users.map((user) => {
    const stats = statsMap.get(user._id.toString());
    return {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      checkInCount: stats?.count || 0,
      lastCheckIn: stats?.lastCheckIn || null,
      registeredAt: user.createdAt,
    };
  });

  // Calculate total check-ins
  const totalCheckIns = checkInStats.reduce((sum, stat) => sum + stat.count, 0);

  return {
    totalUsers: users.length,
    totalCheckIns,
    users: userStats,
  };
}

/**
 * Get statistics for a specific user
 *
 * Returns detailed statistics for the specified user including
 * check-in count, first and last check-in dates.
 *
 * @param userId - The user's ID
 * @returns Individual user statistics
 */
export async function getUserStats(
  userId: string | Types.ObjectId
): Promise<IndividualUserStats | null> {
  // Get user data
  const user = await User.findById(userId).lean();

  if (!user) {
    return null;
  }

  // Get check-in count
  const checkInCount = await CheckIn.countDocuments({ userId });

  // Get first and last check-in timestamps
  const [firstCheckInDoc, lastCheckInDoc] = await Promise.all([
    CheckIn.findOne({ userId }).sort({ timestamp: 1 }).select('timestamp').lean(),
    CheckIn.findOne({ userId }).sort({ timestamp: -1 }).select('timestamp').lean(),
  ]);

  return {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    checkInCount,
    lastCheckIn: lastCheckInDoc?.timestamp || null,
    registeredAt: user.createdAt,
    firstCheckIn: firstCheckInDoc?.timestamp || null,
  };
}
