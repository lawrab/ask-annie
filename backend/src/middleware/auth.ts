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
