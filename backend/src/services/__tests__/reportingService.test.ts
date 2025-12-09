import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { getAllUsersStats, getUserStats } from '../reportingService';
import User from '../../models/User';
import CheckIn from '../../models/CheckIn';

// Mock the models
jest.mock('../../models/User');
jest.mock('../../models/CheckIn');

describe('Reporting Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsersStats', () => {
    it('should return statistics for all users with check-ins', async () => {
      // Arrange
      const mockUsers: any[] = [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          username: 'user1',
          email: 'user1@example.com',
          createdAt: new Date('2024-01-01'),
        },
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
          username: 'user2',
          email: 'user2@example.com',
          createdAt: new Date('2024-01-02'),
        },
      ];

      const mockCheckInStats: any[] = [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          count: 5,
          lastCheckIn: new Date('2024-12-01'),
        },
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
          count: 3,
          lastCheckIn: new Date('2024-12-02'),
        },
      ];

      (User.find as any).mockReturnValue({
        sort: (jest.fn() as any).mockReturnThis(),
        lean: (jest.fn() as any).mockResolvedValue(mockUsers),
      });

      (CheckIn.aggregate as any).mockResolvedValue(mockCheckInStats);

      // Act
      const result = await getAllUsersStats();

      // Assert
      expect(result.totalUsers).toBe(2);
      expect(result.totalCheckIns).toBe(8); // 5 + 3
      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toEqual({
        userId: '507f1f77bcf86cd799439011',
        username: 'user1',
        email: 'user1@example.com',
        checkInCount: 5,
        lastCheckIn: new Date('2024-12-01'),
        registeredAt: new Date('2024-01-01'),
      });
      expect(result.users[1]).toEqual({
        userId: '507f1f77bcf86cd799439012',
        username: 'user2',
        email: 'user2@example.com',
        checkInCount: 3,
        lastCheckIn: new Date('2024-12-02'),
        registeredAt: new Date('2024-01-02'),
      });
    });

    it('should handle users with no check-ins', async () => {
      // Arrange
      const mockUsers: any[] = [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          username: 'newuser',
          email: 'newuser@example.com',
          createdAt: new Date('2024-12-01'),
        },
      ];

      (User.find as any).mockReturnValue({
        sort: (jest.fn() as any).mockReturnThis(),
        lean: (jest.fn() as any).mockResolvedValue(mockUsers),
      });

      (CheckIn.aggregate as any).mockResolvedValue([]);

      // Act
      const result = await getAllUsersStats();

      // Assert
      expect(result.totalUsers).toBe(1);
      expect(result.totalCheckIns).toBe(0);
      expect(result.users).toHaveLength(1);
      expect(result.users[0]).toEqual({
        userId: '507f1f77bcf86cd799439011',
        username: 'newuser',
        email: 'newuser@example.com',
        checkInCount: 0,
        lastCheckIn: null,
        registeredAt: new Date('2024-12-01'),
      });
    });

    it('should handle empty database (no users)', async () => {
      // Arrange
      (User.find as any).mockReturnValue({
        sort: (jest.fn() as any).mockReturnThis(),
        lean: (jest.fn() as any).mockResolvedValue([]),
      });

      (CheckIn.aggregate as any).mockResolvedValue([]);

      // Act
      const result = await getAllUsersStats();

      // Assert
      expect(result.totalUsers).toBe(0);
      expect(result.totalCheckIns).toBe(0);
      expect(result.users).toHaveLength(0);
    });

    it('should handle mixed case with some users having check-ins and others not', async () => {
      // Arrange
      const mockUsers: any[] = [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          username: 'activeuser',
          email: 'active@example.com',
          createdAt: new Date('2024-01-01'),
        },
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
          username: 'inactiveuser',
          email: 'inactive@example.com',
          createdAt: new Date('2024-01-02'),
        },
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
          username: 'anotheractive',
          email: 'another@example.com',
          createdAt: new Date('2024-01-03'),
        },
      ];

      const mockCheckInStats: any[] = [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          count: 10,
          lastCheckIn: new Date('2024-12-05'),
        },
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
          count: 2,
          lastCheckIn: new Date('2024-12-03'),
        },
      ];

      (User.find as any).mockReturnValue({
        sort: (jest.fn() as any).mockReturnThis(),
        lean: (jest.fn() as any).mockResolvedValue(mockUsers),
      });

      (CheckIn.aggregate as any).mockResolvedValue(mockCheckInStats);

      // Act
      const result = await getAllUsersStats();

      // Assert
      expect(result.totalUsers).toBe(3);
      expect(result.totalCheckIns).toBe(12); // 10 + 2
      expect(result.users).toHaveLength(3);

      // Check active user
      const activeUser = result.users.find((u) => u.username === 'activeuser');
      expect(activeUser?.checkInCount).toBe(10);
      expect(activeUser?.lastCheckIn).toEqual(new Date('2024-12-05'));

      // Check inactive user
      const inactiveUser = result.users.find((u) => u.username === 'inactiveuser');
      expect(inactiveUser?.checkInCount).toBe(0);
      expect(inactiveUser?.lastCheckIn).toBeNull();

      // Check another active user
      const anotherActive = result.users.find((u) => u.username === 'anotheractive');
      expect(anotherActive?.checkInCount).toBe(2);
    });

    it('should sort users by creation date descending', async () => {
      // Arrange
      const mockUsers: any[] = [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
          username: 'newest',
          email: 'newest@example.com',
          createdAt: new Date('2024-12-03'),
        },
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
          username: 'middle',
          email: 'middle@example.com',
          createdAt: new Date('2024-12-02'),
        },
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          username: 'oldest',
          email: 'oldest@example.com',
          createdAt: new Date('2024-12-01'),
        },
      ];

      (User.find as any).mockReturnValue({
        sort: (jest.fn() as any).mockReturnThis(),
        lean: (jest.fn() as any).mockResolvedValue(mockUsers),
      });

      (CheckIn.aggregate as any).mockResolvedValue([]);

      // Act
      await getAllUsersStats();

      // Assert
      const sortCall = (User.find as any).mock.results[0].value.sort;
      expect(sortCall).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('getUserStats', () => {
    const userId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    it('should return stats for user with check-ins', async () => {
      // Arrange
      const mockUser: any = {
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
      };

      const firstCheckIn: any = { timestamp: new Date('2024-06-01') };
      const lastCheckIn: any = { timestamp: new Date('2024-12-01') };

      (User.findById as any).mockReturnValue({
        lean: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      (CheckIn.countDocuments as any).mockResolvedValue(15);

      (CheckIn.findOne as any)
        .mockReturnValueOnce({
          sort: (jest.fn() as any).mockReturnThis(),
          select: (jest.fn() as any).mockReturnThis(),
          lean: (jest.fn() as any).mockResolvedValue(firstCheckIn),
        })
        .mockReturnValueOnce({
          sort: (jest.fn() as any).mockReturnThis(),
          select: (jest.fn() as any).mockReturnThis(),
          lean: (jest.fn() as any).mockResolvedValue(lastCheckIn),
        });

      // Act
      const result = await getUserStats(userId);

      // Assert
      expect(result).toEqual({
        userId: userId.toString(),
        username: 'testuser',
        email: 'test@example.com',
        checkInCount: 15,
        lastCheckIn: new Date('2024-12-01'),
        registeredAt: new Date('2024-01-01'),
        firstCheckIn: new Date('2024-06-01'),
      });
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      (User.findById as any).mockReturnValue({
        lean: (jest.fn() as any).mockResolvedValue(null),
      });

      // Act
      const result = await getUserStats(userId);

      // Assert
      expect(result).toBeNull();
      expect(CheckIn.countDocuments).not.toHaveBeenCalled();
    });

    it('should handle user with no check-ins', async () => {
      // Arrange
      const mockUser: any = {
        _id: userId,
        username: 'newuser',
        email: 'new@example.com',
        createdAt: new Date('2024-12-01'),
      };

      (User.findById as any).mockReturnValue({
        lean: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      (CheckIn.countDocuments as any).mockResolvedValue(0);

      (CheckIn.findOne as any)
        .mockReturnValueOnce({
          sort: (jest.fn() as any).mockReturnThis(),
          select: (jest.fn() as any).mockReturnThis(),
          lean: (jest.fn() as any).mockResolvedValue(null),
        })
        .mockReturnValueOnce({
          sort: (jest.fn() as any).mockReturnThis(),
          select: (jest.fn() as any).mockReturnThis(),
          lean: (jest.fn() as any).mockResolvedValue(null),
        });

      // Act
      const result = await getUserStats(userId);

      // Assert
      expect(result).toEqual({
        userId: userId.toString(),
        username: 'newuser',
        email: 'new@example.com',
        checkInCount: 0,
        lastCheckIn: null,
        registeredAt: new Date('2024-12-01'),
        firstCheckIn: null,
      });
    });

    it('should handle user with single check-in', async () => {
      // Arrange
      const mockUser: any = {
        _id: userId,
        username: 'singleuser',
        email: 'single@example.com',
        createdAt: new Date('2024-01-01'),
      };

      const singleCheckIn: any = { timestamp: new Date('2024-06-15') };

      (User.findById as any).mockReturnValue({
        lean: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      (CheckIn.countDocuments as any).mockResolvedValue(1);

      (CheckIn.findOne as any)
        .mockReturnValueOnce({
          sort: (jest.fn() as any).mockReturnThis(),
          select: (jest.fn() as any).mockReturnThis(),
          lean: (jest.fn() as any).mockResolvedValue(singleCheckIn),
        })
        .mockReturnValueOnce({
          sort: (jest.fn() as any).mockReturnThis(),
          select: (jest.fn() as any).mockReturnThis(),
          lean: (jest.fn() as any).mockResolvedValue(singleCheckIn),
        });

      // Act
      const result = await getUserStats(userId);

      // Assert
      expect(result?.checkInCount).toBe(1);
      expect(result?.firstCheckIn).toEqual(new Date('2024-06-15'));
      expect(result?.lastCheckIn).toEqual(new Date('2024-06-15'));
    });

    it('should accept userId as string', async () => {
      // Arrange
      const userIdString = '507f1f77bcf86cd799439011';
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(userIdString),
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
      };

      (User.findById as any).mockReturnValue({
        lean: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      (CheckIn.countDocuments as any).mockResolvedValue(5);

      (CheckIn.findOne as any)
        .mockReturnValueOnce({
          sort: (jest.fn() as any).mockReturnThis(),
          select: (jest.fn() as any).mockReturnThis(),
          lean: (jest.fn() as any).mockResolvedValue({ timestamp: new Date('2024-06-01') }),
        })
        .mockReturnValueOnce({
          sort: (jest.fn() as any).mockReturnThis(),
          select: (jest.fn() as any).mockReturnThis(),
          lean: (jest.fn() as any).mockResolvedValue({ timestamp: new Date('2024-12-01') }),
        });

      // Act
      const result = await getUserStats(userIdString);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(userIdString);
      expect(User.findById).toHaveBeenCalledWith(userIdString);
    });

    it('should query check-ins with correct sorting', async () => {
      // Arrange
      const mockUser: any = {
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
      };

      const mockSort = (jest.fn() as any).mockReturnThis();
      const mockSelect = (jest.fn() as any).mockReturnThis();
      const mockLean = (jest.fn() as any).mockResolvedValue({ timestamp: new Date() });

      (User.findById as any).mockReturnValue({
        lean: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      (CheckIn.countDocuments as any).mockResolvedValue(5);

      (CheckIn.findOne as any).mockReturnValue({
        sort: mockSort,
        select: mockSelect,
        lean: mockLean,
      });

      // Act
      await getUserStats(userId);

      // Assert
      expect(CheckIn.findOne).toHaveBeenCalledWith({ userId });
      expect(mockSort).toHaveBeenCalledWith({ timestamp: 1 }); // First check-in (ascending)
      expect(mockSort).toHaveBeenCalledWith({ timestamp: -1 }); // Last check-in (descending)
      expect(mockSelect).toHaveBeenCalledWith('timestamp');
    });

    it('should count check-ins for correct user', async () => {
      // Arrange
      const mockUser: any = {
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
      };

      (User.findById as any).mockReturnValue({
        lean: (jest.fn() as any).mockResolvedValue(mockUser),
      });

      (CheckIn.countDocuments as any).mockResolvedValue(10);

      (CheckIn.findOne as any).mockReturnValue({
        sort: (jest.fn() as any).mockReturnThis(),
        select: (jest.fn() as any).mockReturnThis(),
        lean: (jest.fn() as any).mockResolvedValue(null),
      });

      // Act
      await getUserStats(userId);

      // Assert
      expect(CheckIn.countDocuments).toHaveBeenCalledWith({ userId });
    });
  });
});
