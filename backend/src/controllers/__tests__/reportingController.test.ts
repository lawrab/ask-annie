import { Request, Response, NextFunction } from 'express';
import { getAdminStats, getMyStats } from '../reportingController';
import * as reportingService from '../../services/reportingService';

// Mock the reporting service
jest.mock('../../services/reportingService');

describe('Reporting Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: undefined,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('getAdminStats', () => {
    it('should return admin statistics successfully', async () => {
      // Arrange
      const mockStats = {
        totalUsers: 10,
        totalCheckIns: 150,
        users: [
          {
            userId: '507f1f77bcf86cd799439011',
            username: 'user1',
            email: 'user1@example.com',
            checkInCount: 50,
            lastCheckIn: new Date('2024-12-01'),
            registeredAt: new Date('2024-01-01'),
          },
          {
            userId: '507f1f77bcf86cd799439012',
            username: 'user2',
            email: 'user2@example.com',
            checkInCount: 100,
            lastCheckIn: new Date('2024-12-05'),
            registeredAt: new Date('2024-01-15'),
          },
        ],
      };

      (reportingService.getAllUsersStats as jest.Mock).mockResolvedValue(mockStats);

      // Act
      await getAdminStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(reportingService.getAllUsersStats).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty statistics when no users exist', async () => {
      // Arrange
      const mockEmptyStats = {
        totalUsers: 0,
        totalCheckIns: 0,
        users: [],
      };

      (reportingService.getAllUsersStats as jest.Mock).mockResolvedValue(mockEmptyStats);

      // Act
      await getAdminStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockEmptyStats,
      });
    });

    it('should handle service errors and call next', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      (reportingService.getAllUsersStats as jest.Mock).mockRejectedValue(error);

      // Act
      await getAdminStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(reportingService.getAllUsersStats).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should handle unexpected service errors', async () => {
      // Arrange
      const error = new Error('Unexpected error occurred');
      (reportingService.getAllUsersStats as jest.Mock).mockRejectedValue(error);

      // Act
      await getAdminStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should return stats with users that have no check-ins', async () => {
      // Arrange
      const mockStats = {
        totalUsers: 2,
        totalCheckIns: 5,
        users: [
          {
            userId: '507f1f77bcf86cd799439011',
            username: 'activeuser',
            email: 'active@example.com',
            checkInCount: 5,
            lastCheckIn: new Date('2024-12-01'),
            registeredAt: new Date('2024-01-01'),
          },
          {
            userId: '507f1f77bcf86cd799439012',
            username: 'inactiveuser',
            email: 'inactive@example.com',
            checkInCount: 0,
            lastCheckIn: null,
            registeredAt: new Date('2024-06-01'),
          },
        ],
      };

      (reportingService.getAllUsersStats as jest.Mock).mockResolvedValue(mockStats);

      // Act
      await getAdminStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });
  });

  describe('getMyStats', () => {
    it('should return user statistics successfully', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockReq.user = { id: userId } as Express.User;

      const mockUserStats = {
        userId,
        username: 'testuser',
        email: 'test@example.com',
        checkInCount: 25,
        lastCheckIn: new Date('2024-12-05'),
        registeredAt: new Date('2024-01-01'),
        firstCheckIn: new Date('2024-06-01'),
      };

      (reportingService.getUserStats as jest.Mock).mockResolvedValue(mockUserStats);

      // Act
      await getMyStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(reportingService.getUserStats).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUserStats,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockReq.user = { id: userId } as Express.User;

      (reportingService.getUserStats as jest.Mock).mockResolvedValue(null);

      // Act
      await getMyStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(reportingService.getUserStats).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and call next', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockReq.user = { id: userId } as Express.User;

      const error = new Error('Database error');
      (reportingService.getUserStats as jest.Mock).mockRejectedValue(error);

      // Act
      await getMyStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(reportingService.getUserStats).toHaveBeenCalledWith(userId);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should return stats for user with no check-ins', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockReq.user = { id: userId } as Express.User;

      const mockUserStats = {
        userId,
        username: 'newuser',
        email: 'new@example.com',
        checkInCount: 0,
        lastCheckIn: null,
        registeredAt: new Date('2024-12-01'),
        firstCheckIn: null,
      };

      (reportingService.getUserStats as jest.Mock).mockResolvedValue(mockUserStats);

      // Act
      await getMyStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUserStats,
      });
    });

    it('should extract user id from req.user object', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockReq.user = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
      };

      const mockUserStats = {
        userId,
        username: 'testuser',
        email: 'test@example.com',
        checkInCount: 10,
        lastCheckIn: new Date('2024-12-01'),
        registeredAt: new Date('2024-01-01'),
        firstCheckIn: new Date('2024-06-01'),
      };

      (reportingService.getUserStats as jest.Mock).mockResolvedValue(mockUserStats);

      // Act
      await getMyStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(reportingService.getUserStats).toHaveBeenCalledWith(userId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing user id gracefully', async () => {
      // Arrange
      mockReq.user = { id: undefined } as any;

      (reportingService.getUserStats as jest.Mock).mockResolvedValue(null);

      // Act
      await getMyStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should return stats with valid check-in dates', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockReq.user = { id: userId } as Express.User;

      const firstCheckInDate = new Date('2024-01-15');
      const lastCheckInDate = new Date('2024-12-08');

      const mockUserStats = {
        userId,
        username: 'activeuser',
        email: 'active@example.com',
        checkInCount: 100,
        lastCheckIn: lastCheckInDate,
        registeredAt: new Date('2024-01-01'),
        firstCheckIn: firstCheckInDate,
      };

      (reportingService.getUserStats as jest.Mock).mockResolvedValue(mockUserStats);

      // Act
      await getMyStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseData.data.firstCheckIn).toEqual(firstCheckInDate);
      expect(responseData.data.lastCheckIn).toEqual(lastCheckInDate);
    });

    it('should handle database timeout errors', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockReq.user = { id: userId } as Express.User;

      const error = new Error('Query timeout');
      (reportingService.getUserStats as jest.Mock).mockRejectedValue(error);

      // Act
      await getMyStats(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
