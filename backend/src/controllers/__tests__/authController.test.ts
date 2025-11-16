import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { register, login, logout } from '../authController';
import User from '../../models/User';

// Mock dependencies
jest.mock('../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

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

  describe('register', () => {
    describe('Success Cases', () => {
      it('should successfully register a new user and return token', async () => {
        // Arrange
        mockReq.body = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
        };

        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedPassword123',
          notificationTimes: ['08:00', '14:00', '20:00'],
          notificationsEnabled: true,
          createdAt: new Date('2024-01-01T12:00:00Z'),
          save: jest.fn().mockResolvedValue(true),
        };

        (User.findOne as jest.Mock).mockResolvedValue(null); // No existing user
        (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
        (User as any).mockImplementation(() => mockUser);
        (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

        // Act
        await register(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(User.findOne).toHaveBeenCalledWith({
          $or: [{ email: 'test@example.com' }, { username: 'testuser' }],
        });
        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 'salt');
        expect(mockUser.save).toHaveBeenCalled();
        expect(jwt.sign).toHaveBeenCalledWith(
          { id: '507f1f77bcf86cd799439011' },
          expect.any(String),
          expect.objectContaining({
            algorithm: 'HS256',
          })
        );
        expect(mockRes.status).toHaveBeenCalledWith(201);
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
    });

    describe('Error Cases', () => {
      it('should return 409 when email already exists', async () => {
        // Arrange
        mockReq.body = {
          username: 'newuser',
          email: 'existing@example.com',
          password: 'Password123',
        };

        const existingUser = {
          _id: '507f1f77bcf86cd799439011',
          email: 'existing@example.com',
          username: 'existinguser',
        };

        (User.findOne as jest.Mock).mockResolvedValue(existingUser);

        // Act
        await register(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(409);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'User with this email already exists',
        });
        expect(bcrypt.genSalt).not.toHaveBeenCalled();
      });

      it('should return 409 when username already exists', async () => {
        // Arrange
        mockReq.body = {
          username: 'existinguser',
          email: 'new@example.com',
          password: 'Password123',
        };

        const existingUser = {
          _id: '507f1f77bcf86cd799439011',
          email: 'different@example.com',
          username: 'existinguser',
        };

        (User.findOne as jest.Mock).mockResolvedValue(existingUser);

        // Act
        await register(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(409);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'User with this username already exists',
        });
        expect(bcrypt.genSalt).not.toHaveBeenCalled();
      });

      it('should call next with error when database error occurs', async () => {
        // Arrange
        mockReq.body = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
        };

        const dbError = new Error('Database connection failed');
        (User.findOne as jest.Mock).mockRejectedValue(dbError);

        // Act
        await register(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('login', () => {
    describe('Success Cases', () => {
      it('should successfully login user and return token', async () => {
        // Arrange
        mockReq.body = {
          email: 'test@example.com',
          password: 'Password123',
        };

        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedPassword123',
          notificationTimes: ['08:00', '14:00', '20:00'],
          notificationsEnabled: true,
          createdAt: new Date('2024-01-01T12:00:00Z'),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

        // Act
        await login(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(bcrypt.compare).toHaveBeenCalledWith('Password123', 'hashedPassword123');
        expect(jwt.sign).toHaveBeenCalledWith(
          { id: '507f1f77bcf86cd799439011' },
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
    });

    describe('Error Cases', () => {
      it('should return 401 when user not found', async () => {
        // Arrange
        mockReq.body = {
          email: 'nonexistent@example.com',
          password: 'Password123',
        };

        (User.findOne as jest.Mock).mockResolvedValue(null);

        // Act
        await login(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email or password',
        });
        expect(bcrypt.compare).not.toHaveBeenCalled();
      });

      it('should return 401 when password is incorrect', async () => {
        // Arrange
        mockReq.body = {
          email: 'test@example.com',
          password: 'WrongPassword123',
        };

        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedPassword123',
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        // Act
        await login(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(bcrypt.compare).toHaveBeenCalledWith('WrongPassword123', 'hashedPassword123');
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email or password',
        });
        expect(jwt.sign).not.toHaveBeenCalled();
      });

      it('should call next with error when database error occurs', async () => {
        // Arrange
        mockReq.body = {
          email: 'test@example.com',
          password: 'Password123',
        };

        const dbError = new Error('Database connection failed');
        (User.findOne as jest.Mock).mockRejectedValue(dbError);

        // Act
        await login(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('logout', () => {
    describe('Success Cases', () => {
      it('should successfully logout user', async () => {
        // Arrange
        mockReq.user = {
          id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
        };

        // Act
        await logout(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: 'Logged out successfully',
        });
      });

      it('should handle logout even without user in request', async () => {
        // Arrange
        mockReq.user = undefined;

        // Act
        await logout(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: 'Logged out successfully',
        });
      });
    });

    describe('Error Cases', () => {
      it('should call next with error when error occurs', async () => {
        // Arrange
        const error = new Error('Unexpected error');
        mockRes.status = jest.fn().mockImplementation(() => {
          throw error;
        });

        // Act
        await logout(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });
});
