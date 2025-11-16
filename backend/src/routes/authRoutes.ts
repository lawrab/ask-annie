import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import { register, login, logout } from '../controllers/authController';
import { registerSchema, loginSchema } from '../utils/validation';

const router = Router();

/**
 * Rate limiter for authentication endpoints to prevent brute force attacks
 * Allows 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * POST /api/auth/register
 * Create a new user account with hashed password
 * Body: { username, email, password }
 * Response: { success, data: { user, token } }
 */
router.post('/register', authLimiter, validateRequest(registerSchema), register);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * Body: { email, password }
 * Response: { success, data: { user, token } }
 */
router.post('/login', authLimiter, validateRequest(loginSchema), login);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 * Requires authentication
 * Response: { success, message }
 */
router.post('/logout', authenticate, logout);

export default router;
