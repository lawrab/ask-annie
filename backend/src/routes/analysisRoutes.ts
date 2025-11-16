import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getSymptomsAnalysis } from '../controllers/analysisController';

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

export default router;
