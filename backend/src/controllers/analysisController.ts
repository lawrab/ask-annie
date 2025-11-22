import { Request, Response, NextFunction } from 'express';
import {
  analyzeSymptomsForUser,
  analyzeTrendForSymptom,
  calculateStreak,
  calculateQuickStats,
} from '../services/analysisService';
import { logger } from '../utils/logger';

/**
 * GET /api/analysis/symptoms
 * Returns aggregated symptom statistics for the authenticated user
 */
export async function getSymptomsAnalysis(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get userId from authenticated user
    const userId = (req.user as { id: string })!.id;

    logger.info('Fetching symptoms analysis', { userId });

    // Analyze symptoms
    const analysis = await analyzeSymptomsForUser(userId);

    logger.info('Symptoms analysis completed', {
      userId,
      symptomCount: analysis.symptoms.length,
      totalCheckins: analysis.totalCheckins,
    });

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error('Error fetching symptoms analysis', { error });
    next(error);
  }
}

/**
 * GET /api/analysis/trends/:symptom
 * Returns time-series trend data for a specific symptom
 */
export async function getSymptomTrend(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get userId from authenticated user
    const userId = (req.user as { id: string })!.id;
    const symptomName = req.params.symptom;

    // Parse and validate days parameter
    const daysParam = req.query.days as string | undefined;
    let days = 14; // default

    if (daysParam) {
      days = parseInt(daysParam, 10);

      // Validate days parameter
      if (isNaN(days) || days < 1) {
        res.status(400).json({
          success: false,
          error: 'Days parameter must be a positive integer',
        });
        return;
      }

      if (days > 365) {
        res.status(400).json({
          success: false,
          error: 'Days parameter cannot exceed 365',
        });
        return;
      }
    }

    logger.info('Fetching symptom trend', { userId, symptomName, days });

    // Analyze trend
    const trend = await analyzeTrendForSymptom(userId, symptomName, days);

    if (trend === null) {
      res.status(404).json({
        success: false,
        error: 'No numeric data found for this symptom in the specified time period',
      });
      return;
    }

    logger.info('Symptom trend completed', {
      userId,
      symptom: trend.symptom,
      dataPointCount: trend.dataPoints.length,
    });

    res.status(200).json({
      success: true,
      data: trend,
    });
  } catch (error) {
    logger.error('Error fetching symptom trend', { error });
    next(error);
  }
}

/**
 * GET /api/analysis/streak
 * Returns streak statistics for the authenticated user
 */
export async function getStreak(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get userId from authenticated user
    const userId = (req.user as { id: string })!.id;

    logger.info('Fetching streak statistics', { userId });

    // Calculate streak
    const streak = await calculateStreak(userId);

    logger.info('Streak calculation completed', {
      userId,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      activeDays: streak.activeDays,
    });

    res.status(200).json({
      success: true,
      data: streak,
    });
  } catch (error) {
    logger.error('Error fetching streak statistics', { error });
    next(error);
  }
}

/**
 * Get quick statistics for week-over-week comparison
 */
export async function getQuickStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;

    // Parse and validate days parameter
    const daysParam = req.query.days as string | undefined;
    let days = 7; // Default

    if (daysParam) {
      const parsedDays = parseInt(daysParam, 10);

      if (isNaN(parsedDays) || parsedDays <= 0) {
        res.status(400).json({
          success: false,
          error: 'Days parameter must be a positive integer',
        });
        return;
      }

      if (parsedDays > 90) {
        res.status(400).json({
          success: false,
          error: 'Days parameter cannot exceed 90',
        });
        return;
      }

      days = parsedDays;
    }

    logger.info('Fetching quick stats', { userId, days });

    const stats = await calculateQuickStats(userId, days);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching quick stats', { error });
    next(error);
  }
}
