import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { exportUserData, deleteAccount, requestDeletion } from '../userController';
import User from '../../models/User';
import CheckIn from '../../models/CheckIn';
import MagicLinkToken from '../../models/MagicLinkToken';

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../models/CheckIn');
jest.mock('../../models/MagicLinkToken');
jest.mock('../../services/emailService', () => ({
  sendDeletionConfirmationEmail: jest.fn(),
}));
jest.mock('crypto');

describe('User Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request
    mockReq = {
      user: { id: 'user123' } as any,
      body: {},
    };

    // Mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('exportUserData', () => {
    it('should export user data successfully with no check-ins', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        notificationTimes: [],
        notificationsEnabled: true,
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      (CheckIn.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await exportUserData(mockReq as Request, mockRes as Response, mockNext);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(CheckIn.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment')
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exportDate: expect.any(String),
          exportVersion: '1.0.0',
          user: expect.objectContaining({
            username: 'testuser',
            email: 'test@example.com',
          }),
          checkIns: [],
          symptoms: [],
          statistics: expect.objectContaining({
            totalCheckIns: 0,
          }),
        })
      );
    });

    it('should export user data with check-ins and extract symptoms/activities/triggers', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        notificationTimes: [],
        notificationsEnabled: true,
      };

      const mockCheckIns = [
        {
          _id: 'checkin1',
          timestamp: new Date('2024-06-15'),
          rawTranscript: 'voice recording',
          structured: {
            summary: 'Headache today',
            symptoms: { headache: 7, fatigue: 5 },
            activities: ['working', 'walking'],
            triggers: ['stress'],
          },
          flaggedForDoctor: false,
          createdAt: new Date('2024-06-15'),
          updatedAt: new Date('2024-06-15'),
        },
        {
          _id: 'checkin2',
          timestamp: new Date('2024-06-14'),
          rawTranscript: 'manual entry',
          structured: {
            summary: 'Nausea',
            symptoms: { nausea: 3 },
            activities: ['sleeping'],
            triggers: ['food'],
          },
          flaggedForDoctor: true,
          createdAt: new Date('2024-06-14'),
          updatedAt: new Date('2024-06-14'),
        },
      ];

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      (CheckIn.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCheckIns),
          }),
        }),
      });

      await exportUserData(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const exportData = (mockRes.json as jest.Mock).mock.calls[0][0];

      expect(exportData.checkIns).toHaveLength(2);
      expect(exportData.symptoms).toEqual(['fatigue', 'headache', 'nausea']);
      expect(exportData.activities).toEqual(['sleeping', 'walking', 'working']);
      expect(exportData.triggers).toEqual(['food', 'stress']);
      expect(exportData.statistics.totalCheckIns).toBe(2);
      expect(exportData.statistics.totalSymptoms).toBe(3);
    });

    it('should return 404 if user not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await exportUserData(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(error),
        }),
      });

      await exportUserData(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('requestDeletion', () => {
    it('should create deletion token and send email', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (MagicLinkToken.find as jest.Mock).mockResolvedValue([]);
      (MagicLinkToken.create as jest.Mock).mockResolvedValue({});
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue('test-deletion-token-123'),
      });

      await requestDeletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(MagicLinkToken.find).toHaveBeenCalled();
      expect(MagicLinkToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          token: 'test-deletion-token-123',
          purpose: 'account-deletion',
          expiresAt: expect.any(Date),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('email sent'),
        })
      );
    });

    it('should return 404 if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await requestDeletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should return 429 if recent deletion request exists', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };

      const recentToken = {
        _id: 'token123',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (MagicLinkToken.find as jest.Mock).mockResolvedValue([recentToken]);

      await requestDeletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('already sent'),
      });
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      (User.findById as jest.Mock).mockRejectedValue(error);

      await requestDeletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteAccount', () => {
    beforeEach(() => {
      mockReq.body = {
        deletionToken: 'valid-deletion-token',
      };
    });

    it('should delete user account and all associated data', async () => {
      const mockToken = {
        _id: 'token123',
        email: 'test@example.com',
        token: 'valid-deletion-token',
        purpose: 'account-deletion',
        createdAt: new Date(),
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };

      (MagicLinkToken.findOne as jest.Mock).mockResolvedValue(mockToken);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (CheckIn.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });
      (MagicLinkToken.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      await deleteAccount(mockReq as Request, mockRes as Response, mockNext);

      expect(MagicLinkToken.findOne).toHaveBeenCalledWith({
        token: 'valid-deletion-token',
        purpose: 'account-deletion',
      });
      expect(CheckIn.deleteMany).toHaveBeenCalledWith({ userId: 'user123' });
      expect(MagicLinkToken.deleteMany).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('permanently deleted'),
      });
    });

    it('should return 400 if deletion token not provided', async () => {
      mockReq.body = {};

      await deleteAccount(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('required'),
      });
    });

    it('should return 400 if token not found', async () => {
      (MagicLinkToken.findOne as jest.Mock).mockResolvedValue(null);

      await deleteAccount(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Invalid or expired'),
      });
    });

    it('should return 403 if token email does not match user', async () => {
      const mockToken = {
        _id: 'token123',
        email: 'other@example.com',
        token: 'valid-deletion-token',
        purpose: 'account-deletion',
        createdAt: new Date(),
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };

      (MagicLinkToken.findOne as jest.Mock).mockResolvedValue(mockToken);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await deleteAccount(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('does not match'),
      });
    });

    it('should return 400 if token is expired (>15 minutes old)', async () => {
      const mockToken = {
        _id: 'token123',
        email: 'test@example.com',
        token: 'valid-deletion-token',
        purpose: 'account-deletion',
        createdAt: new Date(Date.now() - 16 * 60 * 1000), // 16 minutes ago
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };

      (MagicLinkToken.findOne as jest.Mock).mockResolvedValue(mockToken);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (MagicLinkToken.deleteOne as jest.Mock).mockResolvedValue({});

      await deleteAccount(mockReq as Request, mockRes as Response, mockNext);

      expect(MagicLinkToken.deleteOne).toHaveBeenCalledWith({ _id: 'token123' });
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('expired'),
      });
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      (MagicLinkToken.findOne as jest.Mock).mockRejectedValue(error);

      await deleteAccount(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
