import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import User from '../models/User';
import { logger } from '../utils/logger';

/**
 * POST /api/auth/register
 * Creates a new user account with hashed password
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password } = req.body;

    logger.info('Registration attempt', { username, email });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      logger.warn('Registration failed: user already exists', {
        field,
        value: field === 'email' ? email : username,
      });
      res.status(409).json({
        success: false,
        error: `User with this ${field} already exists`,
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    logger.info('User registered successfully', {
      userId: user._id,
      username: user.username,
    });

    // Generate JWT token
    const token = generateToken(String(user._id));

    // Return user data (without password) and token
    res.status(201).json({
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
        token,
      },
    });
  } catch (error) {
    logger.error('Registration error', { error });
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticates user and returns JWT token
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    logger.info('Login attempt', { email });

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn('Login failed: user not found', { email });
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn('Login failed: invalid password', {
        userId: user._id,
        email,
      });
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    logger.info('User logged in successfully', {
      userId: user._id,
      username: user.username,
    });

    // Generate JWT token
    const token = generateToken(String(user._id));

    // Return user data (without password) and token
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
        token,
      },
    });
  } catch (error) {
    logger.error('Login error', { error });
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
    logger.info('User logged out', {
      userId: req.user?.id,
      username: req.user?.username,
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
