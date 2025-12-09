import { Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import { logger } from '../utils/logger';

/**
 * Authentication middleware using Passport JWT strategy
 * Protects routes by requiring valid JWT token in Authorization header
 *
 * Usage:
 *   router.get('/protected', authenticate, controller);
 *
 * Expected header:
 *   Authorization: Bearer <jwt-token>
 *
 * On success: Attaches user to req.user
 * On failure: Returns 401 Unauthorized
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: Express.User | false) => {
    if (err) {
      logger.error('Authentication error', { error: err });
      res.status(500).json({
        success: false,
        error: 'Internal authentication error',
      });
      return;
    }

    if (!user) {
      logger.warn('Authentication failed: invalid or missing token', {
        ip: req.ip,
        path: req.path,
      });
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Admin authorization middleware
 * Requires user to be authenticated AND have admin privileges
 *
 * Usage:
 *   router.get('/admin-only', authenticate, requireAdmin, controller);
 *
 * IMPORTANT: Must be used AFTER authenticate middleware
 *
 * On success: Proceeds to next middleware
 * On failure: Returns 403 Forbidden
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // Check if user is authenticated (should be set by authenticate middleware)
  if (!req.user) {
    logger.warn('Admin check failed: no authenticated user');
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Check if user has admin privileges
  const user = req.user as { id: string; isAdmin?: boolean };
  if (!user.isAdmin) {
    logger.warn('Admin access denied', {
      userId: user.id,
      ip: req.ip,
      path: req.path,
    });
    res.status(403).json({
      success: false,
      error: 'Admin privileges required',
    });
    return;
  }

  logger.info('Admin access granted', {
    userId: user.id,
    path: req.path,
  });

  next();
};
