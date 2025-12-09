import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getAdminStats, getMyStats } from '../controllers/reportingController';

const router = Router();

/**
 * All reporting routes require authentication
 */
router.use(authenticate);

/**
 * GET /api/reporting/my-stats
 * Get check-in statistics for the authenticated user
 */
router.get('/my-stats', getMyStats);

/**
 * GET /api/reporting/admin/all-users
 * Get system-wide statistics for all users
 * (Admin only - requires isAdmin = true)
 */
router.get('/admin/all-users', requireAdmin, getAdminStats);

export default router;
