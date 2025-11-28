import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { StringValue } from 'ms';
import User from '../models/User';
import MagicLinkToken from '../models/MagicLinkToken';
import { sendMagicLinkEmail } from '../services/emailService';
import { logger } from '../utils/logger';

/**
 * POST /api/auth/register
 * Deprecated: Registration now happens via magic link verification
 * This endpoint redirects to magic link flow
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;

    logger.info('Registration redirect to magic link', { email });

    res.status(200).json({
      success: true,
      message: 'Please use magic link authentication. Check your email for a login link.',
      redirectTo: '/api/auth/magic-link/request',
    });
  } catch (error) {
    logger.error('Registration redirect error', { error });
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Deprecated: Login now happens via magic link
 * This endpoint redirects to magic link flow
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;

    logger.info('Login redirect to magic link', { email });

    res.status(200).json({
      success: true,
      message: 'Password login is no longer supported. Please use magic link authentication.',
      redirectTo: '/api/auth/magic-link/request',
    });
  } catch (error) {
    logger.error('Login redirect error', { error });
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Logs out user (client-side token removal)
 * For JWT, logout is primarily client-side (remove token from storage)
 * This endpoint exists for consistency and future token blacklisting
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Type assertion for req.user to handle ts-node type resolution issues
    const user = req.user as { id: string; username: string; email: string } | undefined;
    logger.info('User logged out', {
      userId: user?.id,
      username: user?.username,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error', { error });
    next(error);
  }
}

/**
 * Helper function to generate JWT token
 */
function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as StringValue;

  return jwt.sign({ id: userId }, secret, {
    expiresIn,
    algorithm: 'HS256',
  });
}

/**
 * POST /api/auth/magic-link/request
 * Request a magic link for passwordless authentication
 */
export async function requestMagicLink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
      });
      return;
    }

    logger.info('Magic link request', { email });

    // Check rate limiting: max 3 requests per 15 minutes per email
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentTokens = await MagicLinkToken.countDocuments({
      email,
      createdAt: { $gte: fifteenMinutesAgo },
    });

    if (recentTokens >= 3) {
      logger.warn('Magic link rate limit exceeded', { email, recentTokens });
      res.status(429).json({
        success: false,
        error: 'Too many magic link requests. Please try again in 15 minutes.',
      });
      return;
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration (15 minutes from now)
    const expiryMinutes = parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save token to database
    await MagicLinkToken.create({
      email,
      token,
      expiresAt,
      used: false,
    });

    // Send magic link email
    await sendMagicLinkEmail({ email, token, expiryMinutes });

    logger.info('Magic link sent successfully', { email });

    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a magic link has been sent.',
    });
  } catch (error) {
    logger.error('Magic link request error', { error });
    next(error);
  }
}

/**
 * POST /api/auth/magic-link/verify
 * Verify magic link token and authenticate user
 */
export async function verifyMagicLink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }

    logger.info('Magic link verification attempt', { token: token.substring(0, 8) + '...' });

    // Find valid token
    const magicLinkToken = await MagicLinkToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!magicLinkToken) {
      logger.warn('Invalid or expired magic link token', { token: token.substring(0, 8) + '...' });
      res.status(401).json({
        success: false,
        error: 'Invalid or expired magic link. Please request a new one.',
      });
      return;
    }

    // Mark token as used
    magicLinkToken.used = true;
    await magicLinkToken.save();

    // Find or create user
    let user = await User.findOne({ email: magicLinkToken.email });

    if (!user) {
      // Create new user (passwordless registration)
      const username = magicLinkToken.email.split('@')[0]; // Use email prefix as default username
      user = new User({
        username,
        email: magicLinkToken.email,
        // No password required for magic link users
      });
      await user.save();

      logger.info('New user created via magic link', {
        userId: user._id,
        email: user.email,
      });
    } else {
      logger.info('Existing user authenticated via magic link', {
        userId: user._id,
        email: user.email,
      });
    }

    // Generate JWT token
    const jwtToken = generateToken(String(user._id));

    // Return user data and token
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          notificationTimes: user.notificationTimes,
          notificationsEnabled: user.notificationsEnabled,
          createdAt: user.createdAt,
        },
        token: jwtToken,
      },
    });
  } catch (error) {
    logger.error('Magic link verification error', { error });
    next(error);
  }
}
