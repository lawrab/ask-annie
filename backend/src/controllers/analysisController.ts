import { Request, Response, NextFunction } from 'express';
import { analyzeSymptomsForUser } from '../services/analysisService';
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
