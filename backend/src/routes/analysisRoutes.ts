import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getSymptomsAnalysis, getSymptomTrend } from '../controllers/analysisController';

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

export default router;
