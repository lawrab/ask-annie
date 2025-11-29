import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import {
  register,
  login,
  logout,
  checkEmail,
  requestMagicLink,
  verifyMagicLink,
} from '../controllers/authController';
import {
  generateRegistrationOptions,
  verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthentication,
  listPasskeys,
  deletePasskey,
  updatePasskey,
} from '../controllers/passkeyController';
import {
  registerSchema,
  loginSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
} from '../utils/validation';
import { AUTH_CONSTANTS } from '../constants';

const router = Router();

/**
 * Rate limiter for authentication endpoints to prevent brute force attacks
 * Allows 5 requests per 15 minutes per IP in production
 * Disabled for localhost in development
 */
const authLimiter = rateLimit({
  windowMs: AUTH_CONSTANTS.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: AUTH_CONSTANTS.MAX_MAGIC_LINK_REQUESTS,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for localhost in development
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
    return process.env.NODE_ENV === 'development' && isLocalhost;
  },
});

/**
 * GET /api/auth/check-email
 * Check if an email exists in the system
 * Query: ?email=user@example.com
 * Response: { success, exists }
 * Rate limited to prevent email enumeration attacks
 */
router.get('/check-email', authLimiter, checkEmail);

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

/**
 * POST /api/auth/magic-link/request
 * Request a magic link for passwordless authentication
 * Body: { email }
 * Response: { success, message }
 * Rate limited: 3 requests per 15 minutes per email (handled in controller)
 */
router.post(
  '/magic-link/request',
  authLimiter,
  validateRequest(magicLinkRequestSchema),
  requestMagicLink
);

/**
 * POST /api/auth/magic-link/verify
 * Verify magic link token and authenticate user
 * Body: { token }
 * Response: { success, data: { user, token } }
 */
router.post('/magic-link/verify', validateRequest(magicLinkVerifySchema), verifyMagicLink);

/**
 * POST /api/auth/passkey/registration-options
 * Generate WebAuthn registration options for adding a new passkey
 * Requires authentication
 * Response: { success, data: PublicKeyCredentialCreationOptions }
 */
router.post('/passkey/registration-options', authenticate, generateRegistrationOptions);

/**
 * POST /api/auth/passkey/registration-verification
 * Verify and complete passkey registration
 * Requires authentication
 * Body: { response: RegistrationResponseJSON, deviceName?: string }
 * Response: { success, message }
 */
router.post('/passkey/registration-verification', authenticate, verifyRegistration);

/**
 * POST /api/auth/passkey/authentication-options
 * Generate WebAuthn authentication options for passkey login
 * Body: { email }
 * Response: { success, data: PublicKeyCredentialRequestOptions | null }
 */
router.post('/passkey/authentication-options', authLimiter, generateAuthenticationOptions);

/**
 * POST /api/auth/passkey/authentication-verification
 * Verify passkey authentication and log in user
 * Body: { response: AuthenticationResponseJSON, email }
 * Response: { success, data: { user, token } }
 */
router.post('/passkey/authentication-verification', authLimiter, verifyAuthentication);

/**
 * GET /api/auth/passkeys
 * List all registered passkeys for the authenticated user
 * Requires authentication
 * Response: { success, data: Passkey[] }
 */
router.get('/passkeys', authenticate, listPasskeys);

/**
 * DELETE /api/auth/passkeys/:id
 * Delete a specific passkey
 * Requires authentication
 * Response: { success, message }
 */
router.delete('/passkeys/:id', authenticate, deletePasskey);

/**
 * PATCH /api/auth/passkeys/:id
 * Update passkey device name
 * Requires authentication
 * Body: { deviceName }
 * Response: { success, data: Passkey }
 */
router.patch('/passkeys/:id', authenticate, updatePasskey);

export default router;
