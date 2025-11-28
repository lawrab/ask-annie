import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  register,
  login,
  logout,
  checkEmail,
  requestMagicLink,
  verifyMagicLink,
} from '../authController';
import User from '../../models/User';
import MagicLinkToken from '../../models/MagicLinkToken';
import { sendMagicLinkEmail } from '../../services/emailService';

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../models/MagicLinkToken');
jest.mock('../../services/emailService');
jest.mock('jsonwebtoken');
jest.mock('crypto');

describe('AuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request
    mockReq = {
      body: {},
      query: {},
      user: undefined,
    };

    // Mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('register (deprecated)', () => {
    it('should return redirect message to magic link flow', async () => {
      mockReq.body = { email: 'test@example.com' };

      await register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Please use magic link authentication. Check your email for a login link.',
        redirectTo: '/api/auth/magic-link/request',
      });
    });

    it('should call next with error when error occurs', async () => {
      const error = new Error('Unexpected error');
      mockRes.status = jest.fn().mockImplementation(() => {
        throw error;
      });

      await register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login (deprecated)', () => {
    it('should return redirect message to magic link flow', async () => {
      mockReq.body = { email: 'test@example.com' };

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password login is no longer supported. Please use magic link authentication.',
        redirectTo: '/api/auth/magic-link/request',
      });
    });

    it('should call next with error when error occurs', async () => {
      const error = new Error('Unexpected error');
      mockRes.status = jest.fn().mockImplementation(() => {
        throw error;
      });

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockReq.user = {
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
      };

      await logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should handle logout even without user in request', async () => {
      mockReq.user = undefined;

      await logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should call next with error when error occurs', async () => {
      const error = new Error('Unexpected error');
      mockRes.status = jest.fn().mockImplementation(() => {
        throw error;
      });

      await logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('requestMagicLink', () => {
    beforeEach(() => {
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue('a'.repeat(64)),
      });
    });

    describe('Success Cases', () => {
      it('should successfully request magic link for existing user', async () => {
        mockReq.body = { email: 'test@example.com' };

        // Mock existing user
        (User.findOne as jest.Mock).mockResolvedValue({
          _id: 'user123',
          email: 'test@example.com',
          username: 'testuser',
        });
        (MagicLinkToken.countDocuments as jest.Mock).mockResolvedValue(0);
        (MagicLinkToken.create as jest.Mock).mockResolvedValue({
          email: 'test@example.com',
          token: 'a'.repeat(64),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          used: false,
        });
        (sendMagicLinkEmail as jest.Mock).mockResolvedValue(undefined);

        await requestMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(MagicLinkToken.countDocuments).toHaveBeenCalled();
        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(MagicLinkToken.create).toHaveBeenCalledWith({
          email: 'test@example.com',
          token: 'a'.repeat(64),
          expiresAt: expect.any(Date),
          used: false,
          username: undefined,
        });
        expect(sendMagicLinkEmail).toHaveBeenCalledWith({
          email: 'test@example.com',
          token: 'a'.repeat(64),
          expiryMinutes: 15,
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: 'If an account exists with this email, a magic link has been sent.',
        });
      });

      it('should successfully request magic link for new user with username', async () => {
        mockReq.body = { email: 'newuser@example.com', username: 'newuser' };

        // Mock no existing user
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (MagicLinkToken.countDocuments as jest.Mock).mockResolvedValue(0);
        (MagicLinkToken.create as jest.Mock).mockResolvedValue({
          email: 'newuser@example.com',
          token: 'a'.repeat(64),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          used: false,
          username: 'newuser',
        });
        (sendMagicLinkEmail as jest.Mock).mockResolvedValue(undefined);

        await requestMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'newuser@example.com' });
        expect(User.findOne).toHaveBeenCalledWith({ username: 'newuser' });
        expect(MagicLinkToken.countDocuments).toHaveBeenCalled();
        expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        expect(MagicLinkToken.create).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          token: 'a'.repeat(64),
          expiresAt: expect.any(Date),
          used: false,
          username: 'newuser',
        });
        expect(sendMagicLinkEmail).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          token: 'a'.repeat(64),
          expiryMinutes: 15,
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: 'If an account exists with this email, a magic link has been sent.',
        });
      });
    });

    describe('Error Cases', () => {
      it('should return 400 when email is missing', async () => {
        mockReq.body = {};

        await requestMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Email is required',
        });
        expect(MagicLinkToken.countDocuments).not.toHaveBeenCalled();
      });

      it('should return 429 when rate limit is exceeded', async () => {
        mockReq.body = { email: 'test@example.com' };

        // Mock existing user
        (User.findOne as jest.Mock).mockResolvedValue({
          _id: 'user123',
          email: 'test@example.com',
        });
        (MagicLinkToken.countDocuments as jest.Mock).mockResolvedValue(3);

        await requestMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(429);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Too many magic link requests. Please try again in 15 minutes.',
        });
        expect(MagicLinkToken.create).not.toHaveBeenCalled();
        expect(sendMagicLinkEmail).not.toHaveBeenCalled();
      });

      it('should call next with error when database error occurs', async () => {
        mockReq.body = { email: 'test@example.com' };

        const dbError = new Error('Database connection failed');
        (MagicLinkToken.countDocuments as jest.Mock).mockRejectedValue(dbError);

        await requestMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should return 400 when new user does not provide username', async () => {
        mockReq.body = { email: 'newuser@example.com' };

        // Mock no existing user
        (User.findOne as jest.Mock).mockResolvedValue(null);
        // Mock rate limit check (not exceeded)
        (MagicLinkToken.countDocuments as jest.Mock).mockResolvedValue(0);

        await requestMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Username is required for new user registration',
        });
        expect(MagicLinkToken.create).not.toHaveBeenCalled();
      });

      it('should return 400 when username is already taken', async () => {
        mockReq.body = { email: 'newuser@example.com', username: 'existinguser' };

        // Mock no existing user with this email, but username exists
        (User.findOne as jest.Mock)
          .mockResolvedValueOnce(null) // First call for email check
          .mockResolvedValueOnce({
            // Second call for username check
            _id: 'user123',
            username: 'existinguser',
          });
        // Mock rate limit check (not exceeded)
        (MagicLinkToken.countDocuments as jest.Mock).mockResolvedValue(0);

        await requestMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Username is already taken',
        });
        expect(MagicLinkToken.create).not.toHaveBeenCalled();
      });

      it('should call next with error when database error occurs', async () => {
        mockReq.body = { email: 'test@example.com' };

        const dbError = new Error('Database connection failed');
        (User.findOne as jest.Mock).mockRejectedValue(dbError);

        await requestMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should call next with error when email service fails', async () => {
        mockReq.body = { email: 'test@example.com' };

        // Mock existing user
        (User.findOne as jest.Mock).mockResolvedValue({
          _id: 'user123',
          email: 'test@example.com',
        });
        (MagicLinkToken.countDocuments as jest.Mock).mockResolvedValue(0);
        (crypto.randomBytes as jest.Mock).mockReturnValue({
          toString: jest.fn().mockReturnValue('a'.repeat(64)),
        });
        (MagicLinkToken.create as jest.Mock).mockResolvedValue({});

        const emailError = new Error('Email service failed');
        (sendMagicLinkEmail as jest.Mock).mockRejectedValue(emailError);

        await requestMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(emailError);
      });
    });
  });

  describe('checkEmail', () => {
    it('should return exists: true for existing email', async () => {
      mockReq.query = { email: 'test@example.com' };

      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
      });

      await checkEmail(mockReq as Request, mockRes as Response, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        exists: true,
      });
    });

    it('should return exists: false for non-existing email', async () => {
      mockReq.query = { email: 'newuser@example.com' };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await checkEmail(mockReq as Request, mockRes as Response, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'newuser@example.com' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        exists: false,
      });
    });

    it('should return 400 when email is missing', async () => {
      mockReq.query = {};

      await checkEmail(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required',
      });
    });

    it('should call next with error when database error occurs', async () => {
      mockReq.query = { email: 'test@example.com' };

      const dbError = new Error('Database error');
      (User.findOne as jest.Mock).mockRejectedValue(dbError);

      await checkEmail(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('verifyMagicLink', () => {
    describe('Success Cases', () => {
      it('should successfully verify magic link for existing user', async () => {
        mockReq.body = { token: 'a'.repeat(64) };

        const mockMagicLinkToken = {
          email: 'test@example.com',
          token: 'a'.repeat(64),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          used: false,
          username: undefined,
          save: jest.fn().mockResolvedValue(true),
        };

        const mockUser = {
          _id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          notificationTimes: ['08:00', '14:00', '20:00'],
          notificationsEnabled: true,
          createdAt: new Date('2024-01-01T12:00:00Z'),
        };

        (MagicLinkToken.findOne as jest.Mock).mockResolvedValue(mockMagicLinkToken);
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

        await verifyMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(MagicLinkToken.findOne).toHaveBeenCalledWith({
          token: 'a'.repeat(64),
          used: false,
          expiresAt: { $gt: expect.any(Date) },
        });
        expect(mockMagicLinkToken.used).toBe(true);
        expect(mockMagicLinkToken.save).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(jwt.sign).toHaveBeenCalledWith(
          { id: 'user123' },
          expect.any(String),
          expect.objectContaining({
            algorithm: 'HS256',
          })
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: {
            user: {
              id: mockUser._id,
              username: mockUser.username,
              email: mockUser.email,
              notificationTimes: mockUser.notificationTimes,
              notificationsEnabled: mockUser.notificationsEnabled,
              createdAt: mockUser.createdAt,
            },
            token: 'mock-jwt-token',
          },
        });
      });

      it('should successfully verify magic link and create new user with username from token', async () => {
        mockReq.body = { token: 'a'.repeat(64) };

        const mockMagicLinkToken = {
          email: 'newuser@example.com',
          token: 'a'.repeat(64),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          used: false,
          username: 'newuser', // Username provided during registration
          save: jest.fn().mockResolvedValue(true),
        };

        const mockNewUser = {
          _id: '507f1f77bcf86cd799439012',
          username: 'newuser',
          email: 'newuser@example.com',
          notificationTimes: ['08:00', '14:00', '20:00'],
          notificationsEnabled: true,
          createdAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
        };

        (MagicLinkToken.findOne as jest.Mock).mockResolvedValue(mockMagicLinkToken);
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User as any).mockImplementation(() => mockNewUser);
        (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

        await verifyMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(MagicLinkToken.findOne).toHaveBeenCalled();
        expect(mockMagicLinkToken.used).toBe(true);
        expect(mockMagicLinkToken.save).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalledWith({ email: 'newuser@example.com' });
        expect(mockNewUser.save).toHaveBeenCalled();
        expect(jwt.sign).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: {
            user: {
              id: mockNewUser._id,
              username: mockNewUser.username,
              email: mockNewUser.email,
              notificationTimes: mockNewUser.notificationTimes,
              notificationsEnabled: mockNewUser.notificationsEnabled,
              createdAt: mockNewUser.createdAt,
            },
            token: 'mock-jwt-token',
          },
        });
      });

      it('should successfully verify magic link and create new user with email prefix as username', async () => {
        mockReq.body = { token: 'a'.repeat(64) };

        const mockMagicLinkToken = {
          email: 'newuser@example.com',
          token: 'a'.repeat(64),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          used: false,
          username: undefined, // No username provided - should use email prefix
          save: jest.fn().mockResolvedValue(true),
        };

        const mockNewUser = {
          _id: '507f1f77bcf86cd799439013',
          username: 'newuser', // Email prefix
          email: 'newuser@example.com',
          notificationTimes: ['08:00', '14:00', '20:00'],
          notificationsEnabled: true,
          createdAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
        };

        (MagicLinkToken.findOne as jest.Mock).mockResolvedValue(mockMagicLinkToken);
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User as any).mockImplementation(() => mockNewUser);
        (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

        await verifyMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(MagicLinkToken.findOne).toHaveBeenCalled();
        expect(mockMagicLinkToken.used).toBe(true);
        expect(mockMagicLinkToken.save).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalledWith({ email: 'newuser@example.com' });
        expect(mockNewUser.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Error Cases', () => {
      it('should return 400 when token is missing', async () => {
        mockReq.body = {};

        await verifyMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Token is required',
        });
        expect(MagicLinkToken.findOne).not.toHaveBeenCalled();
      });

      it('should return 401 when token is invalid', async () => {
        mockReq.body = { token: 'invalid-token' };

        (MagicLinkToken.findOne as jest.Mock).mockResolvedValue(null);

        await verifyMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid or expired magic link. Please request a new one.',
        });
        expect(User.findOne).not.toHaveBeenCalled();
      });

      it('should return 401 when token is expired', async () => {
        mockReq.body = { token: 'expired-token' };

        // Token exists but is expired (findOne returns null due to expiresAt query)
        (MagicLinkToken.findOne as jest.Mock).mockResolvedValue(null);

        await verifyMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid or expired magic link. Please request a new one.',
        });
      });

      it('should return 401 when token is already used', async () => {
        mockReq.body = { token: 'used-token' };

        // Token exists but is used (findOne returns null due to used: false query)
        (MagicLinkToken.findOne as jest.Mock).mockResolvedValue(null);

        await verifyMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid or expired magic link. Please request a new one.',
        });
      });

      it('should call next with error when database error occurs', async () => {
        mockReq.body = { token: 'valid-token' };

        const dbError = new Error('Database connection failed');
        (MagicLinkToken.findOne as jest.Mock).mockRejectedValue(dbError);

        await verifyMagicLink(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });
  });
});
