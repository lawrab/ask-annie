import { Request, Response, NextFunction } from 'express';
import { getAllUsersStats, getUserStats } from '../services/reportingService';
import { logger } from '../utils/logger';

/**
 * GET /api/reporting/admin/all-users
 * Returns system-wide statistics including all users and their check-in data
 * (Admin only)
 */
export async function getAdminStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.info('Fetching admin statistics');

    const stats = await getAllUsersStats();

    logger.info('Admin statistics completed', {
      totalUsers: stats.totalUsers,
      totalCheckIns: stats.totalCheckIns,
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching admin statistics', { error });
    next(error);
  }
}

/**
 * GET /api/reporting/my-stats
 * Returns check-in statistics for the authenticated user
 */
export async function getMyStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;

    logger.info('Fetching user statistics', { userId });

    const stats = await getUserStats(userId);

    if (!stats) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    logger.info('User statistics completed', {
      userId,
      checkInCount: stats.checkInCount,
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching user statistics', { error });
    next(error);
  }
}
