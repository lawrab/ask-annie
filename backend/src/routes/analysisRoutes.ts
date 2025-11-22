import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSymptomsAnalysis,
  getSymptomTrend,
  getStreak,
  getQuickStats,
} from '../controllers/analysisController';

const router = Router();

/**
 * All analysis routes require authentication
 */
router.use(authenticate);

/**
 * GET /api/analysis/symptoms
 * Get aggregated symptom statistics for the authenticated user
 */
router.get('/symptoms', getSymptomsAnalysis);

/**
 * GET /api/analysis/trends/:symptom
 * Get time-series trend data for a specific symptom
 * Query params: days (default: 14, max: 365)
 */
router.get('/trends/:symptom', getSymptomTrend);

/**
 * GET /api/analysis/streak
 * Get streak statistics for the authenticated user
 * Returns current streak, longest streak, active days, and total days
 */
router.get('/streak', getStreak);

/**
 * GET /api/analysis/quick-stats
 * Get quick statistics for week-over-week comparison
 * Query params: days (default: 7, max: 90)
 */
router.get('/quick-stats', getQuickStats);

export default router;
