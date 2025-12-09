import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import User from '../models/User';
import { logger } from '../utils/logger';

/**
 * JWT Strategy Configuration for Passport
 * Extracts JWT from Authorization header and validates against database
 */

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  algorithms: ['HS256'],
};

passport.use(
  new JwtStrategy(options, async (jwtPayload, done) => {
    try {
      // Verify user still exists in database
      const user = await User.findById(jwtPayload.id).select('-password');

      if (!user) {
        logger.warn('JWT authentication failed: user not found', {
          userId: jwtPayload.id,
        });
        return done(null, false);
      }

      // Attach user to request
      logger.debug('JWT authentication successful', {
        userId: user._id,
        username: user.username,
      });

      return done(null, {
        id: String(user._id),
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      logger.error('Error in JWT strategy', { error });
      return done(error, false);
    }
  })
);

export default passport;
