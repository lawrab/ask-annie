import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { exportUserData, deleteAccount, requestDeletion } from '../controllers/userController';

const router = Router();

/**
 * Rate limiter for account deletion requests to prevent abuse
 * Allows 2 requests per hour per IP
 */
const deletionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // Limit each IP to 2 requests per hour
  message: {
    success: false,
    error: 'Too many deletion requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
    return process.env.NODE_ENV === 'development' && isLocalhost;
  },
});

/**
 * GET /api/user/export
 * Export all user data in JSON format
 * GDPR compliance - Right to data portability
 * Requires authentication
 * Response: JSON file download with all user data
 */
router.get('/export', authenticate, exportUserData);

/**
 * POST /api/user/request-deletion
 * Request account deletion - sends confirmation email with magic link
 * Requires authentication
 * Response: { success, message }
 * Rate limited to 2 requests per hour
 */
router.post('/request-deletion', authenticate, deletionLimiter, requestDeletion);

/**
 * DELETE /api/user/account
 * Permanently delete user account and all associated data
 * GDPR compliance - Right to erasure
 * Requires authentication and deletion token from magic link
 * Body: { deletionToken }
 * Response: { success, message }
 */
router.delete('/account', authenticate, deleteAccount);

export default router;
