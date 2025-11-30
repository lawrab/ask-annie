import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  getSymptomsAnalysis,
  getSymptomTrend,
  getStreak,
  getQuickStats,
} from '../analysisController';
import * as analysisService from '../../services/analysisService';

// Mock the analysis service
jest.mock('../../services/analysisService');

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Analysis Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAnalyzeSymptomsForUser: jest.MockedFunction<
    typeof analysisService.analyzeSymptomsForUser
  >;
  let mockAnalyzeTrendForSymptom: jest.MockedFunction<
    typeof analysisService.analyzeTrendForSymptom
  >;
  let mockCalculateStreak: jest.MockedFunction<typeof analysisService.calculateStreak>;
  let mockCalculateQuickStats: jest.MockedFunction<typeof analysisService.calculateQuickStats>;

  beforeEach(() => {
    mockRequest = {
      user: { id: 'user123', username: 'testuser', email: 'test@example.com' },
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as unknown as Response['status'],
      json: jest.fn() as unknown as Response['json'],
    };

    mockNext = jest.fn() as NextFunction;

    mockAnalyzeSymptomsForUser = analysisService.analyzeSymptomsForUser as jest.MockedFunction<
      typeof analysisService.analyzeSymptomsForUser
    >;

    mockAnalyzeTrendForSymptom = analysisService.analyzeTrendForSymptom as jest.MockedFunction<
      typeof analysisService.analyzeTrendForSymptom
    >;

    mockCalculateStreak = analysisService.calculateStreak as jest.MockedFunction<
      typeof analysisService.calculateStreak
    >;

    mockCalculateQuickStats = analysisService.calculateQuickStats as jest.MockedFunction<
      typeof analysisService.calculateQuickStats
    >;

    jest.clearAllMocks();
  });

  describe('getSymptomsAnalysis', () => {
    it('should return symptoms analysis for authenticated user', async () => {
      const mockAnalysis = {
        symptoms: [
          {
            name: 'pain_level',
            count: 10,
            percentage: 100,
            type: analysisService.SymptomValueType.NUMERIC,
            min: 1,
            max: 9,
            average: 5.2,
          },
        ],
        totalCheckins: 10,
      };

      mockAnalyzeSymptomsForUser.mockResolvedValue(mockAnalysis);

      await getSymptomsAnalysis(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAnalyzeSymptomsForUser).toHaveBeenCalledWith('user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysis,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no check-ins', async () => {
      const mockAnalysis = {
        symptoms: [],
        totalCheckins: 0,
      };

      mockAnalyzeSymptomsForUser.mockResolvedValue(mockAnalysis);

      await getSymptomsAnalysis(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysis,
      });
    });

    it('should call next with error when service throws', async () => {
      const error = new Error('Database error');
      mockAnalyzeSymptomsForUser.mockRejectedValue(error);

      await getSymptomsAnalysis(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle multiple symptoms with different types', async () => {
      const mockAnalysis = {
        symptoms: [
          {
            name: 'pain_level',
            count: 10,
            percentage: 83.3,
            type: analysisService.SymptomValueType.NUMERIC,
            min: 1,
            max: 9,
            average: 5.2,
          },
          {
            name: 'mood',
            count: 8,
            percentage: 66.7,
            type: analysisService.SymptomValueType.CATEGORICAL,
            values: ['good', 'bad', 'moderate'],
          },
          {
            name: 'headache',
            count: 5,
            percentage: 41.7,
            type: analysisService.SymptomValueType.BOOLEAN,
          },
        ],
        totalCheckins: 12,
      };

      mockAnalyzeSymptomsForUser.mockResolvedValue(mockAnalysis);

      await getSymptomsAnalysis(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysis,
      });
    });
  });

  describe('getSymptomTrend', () => {
    beforeEach(() => {
      mockRequest.params = { symptom: 'pain_level' };
    });

    it('should return trend data with default days parameter', async () => {
      const mockTrend = {
        symptom: 'pain_level',
        dateRange: { start: '2024-01-01', end: '2024-01-14' },
        dataPoints: [
          { date: '2024-01-01', value: 5, count: 2 },
          { date: '2024-01-02', value: 6.5, count: 3 },
        ],
        statistics: {
          average: 5.2,
          min: 1,
          max: 9,
          median: 5,
          standardDeviation: 1.8,
        },
      };

      mockAnalyzeTrendForSymptom.mockResolvedValue(mockTrend);

      await getSymptomTrend(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAnalyzeTrendForSymptom).toHaveBeenCalledWith('user123', 'pain_level', 14);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTrend,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use custom days parameter when provided', async () => {
      mockRequest.query = { days: '30' };

      const mockTrend = {
        symptom: 'pain_level',
        dateRange: { start: '2024-01-01', end: '2024-01-30' },
        dataPoints: [],
        statistics: {
          average: 0,
          min: 0,
          max: 0,
          median: 0,
          standardDeviation: 0,
        },
      };

      mockAnalyzeTrendForSymptom.mockResolvedValue(mockTrend);

      await getSymptomTrend(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAnalyzeTrendForSymptom).toHaveBeenCalledWith('user123', 'pain_level', 30);
    });

    it('should return 404 when no numeric data found', async () => {
      mockAnalyzeTrendForSymptom.mockResolvedValue(null);

      await getSymptomTrend(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'No numeric data found for this symptom in the specified time period',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid days parameter (non-numeric)', async () => {
      mockRequest.query = { days: 'invalid' };

      await getSymptomTrend(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Days parameter must be a positive integer',
      });
      expect(mockAnalyzeTrendForSymptom).not.toHaveBeenCalled();
    });

    it('should return 400 for negative days parameter', async () => {
      mockRequest.query = { days: '-5' };

      await getSymptomTrend(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Days parameter must be a positive integer',
      });
      expect(mockAnalyzeTrendForSymptom).not.toHaveBeenCalled();
    });

    it('should return 400 for days parameter exceeding 365', async () => {
      mockRequest.query = { days: '400' };

      await getSymptomTrend(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Days parameter cannot exceed 365',
      });
      expect(mockAnalyzeTrendForSymptom).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      const error = new Error('Database error');
      mockAnalyzeTrendForSymptom.mockRejectedValue(error);

      await getSymptomTrend(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getStreak', () => {
    it('should return streak statistics successfully', async () => {
      const mockStreakData = {
        currentStreak: 5,
        longestStreak: 12,
        activeDays: 30,
        totalDays: 45,
        streakStartDate: '2024-01-01',
        lastLogDate: '2024-01-15',
      };

      mockCalculateStreak.mockResolvedValue(mockStreakData);

      await getStreak(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCalculateStreak).toHaveBeenCalledWith('user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStreakData,
      });
    });

    it('should return zero stats for user with no check-ins', async () => {
      const mockStreakData = {
        currentStreak: 0,
        longestStreak: 0,
        activeDays: 0,
        totalDays: 0,
        streakStartDate: null,
        lastLogDate: null,
      };

      mockCalculateStreak.mockResolvedValue(mockStreakData);

      await getStreak(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCalculateStreak).toHaveBeenCalledWith('user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStreakData,
      });
    });

    it('should handle active streaks correctly', async () => {
      const mockStreakData = {
        currentStreak: 7,
        longestStreak: 7,
        activeDays: 7,
        totalDays: 7,
        streakStartDate: '2024-01-09',
        lastLogDate: '2024-01-15',
      };

      mockCalculateStreak.mockResolvedValue(mockStreakData);

      await getStreak(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          currentStreak: 7,
          longestStreak: 7,
        }),
      });
    });

    it('should call next with error when service throws', async () => {
      const error = new Error('Database error');
      mockCalculateStreak.mockRejectedValue(error);

      await getStreak(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getQuickStats', () => {
    it('should return quick stats with default 7 days', async () => {
      const mockStats = {
        period: {
          current: { start: '2025-11-15', end: '2025-11-21', days: 7 },
          previous: { start: '2025-11-08', end: '2025-11-14', days: 7 },
        },
        checkInCount: {
          current: 15,
          previous: 12,
          change: 3,
          percentChange: 25.0,
        },
        topSymptoms: [
          { name: 'headache', frequency: 5, avgSeverity: 6.2, trend: 'improving' as const },
          { name: 'fatigue', frequency: 4, avgSeverity: 7.5, trend: 'stable' as const },
        ],
        averageSeverity: {
          current: 5.8,
          previous: 6.5,
          change: -0.7,
          trend: 'improving' as const,
        },
      };

      mockCalculateQuickStats.mockResolvedValue(mockStats);

      await getQuickStats(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCalculateQuickStats).toHaveBeenCalledWith('user123', 7);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use custom days parameter when provided', async () => {
      mockRequest.query = { days: '14' };

      const mockStats = {
        period: {
          current: { start: '2025-11-08', end: '2025-11-21', days: 14 },
          previous: { start: '2025-10-25', end: '2025-11-07', days: 14 },
        },
        checkInCount: { current: 25, previous: 20, change: 5, percentChange: 25.0 },
        topSymptoms: [],
        averageSeverity: { current: 5.5, previous: 6.0, change: -0.5, trend: 'improving' as const },
      };

      mockCalculateQuickStats.mockResolvedValue(mockStats);

      await getQuickStats(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCalculateQuickStats).toHaveBeenCalledWith('user123', 14);
    });

    it('should return 400 for invalid days parameter (non-numeric)', async () => {
      mockRequest.query = { days: 'invalid' };

      await getQuickStats(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Days parameter must be a positive integer',
      });
      expect(mockCalculateQuickStats).not.toHaveBeenCalled();
    });

    it('should return 400 for negative days parameter', async () => {
      mockRequest.query = { days: '-5' };

      await getQuickStats(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Days parameter must be a positive integer',
      });
      expect(mockCalculateQuickStats).not.toHaveBeenCalled();
    });

    it('should return 400 for days parameter exceeding 90', async () => {
      mockRequest.query = { days: '100' };

      await getQuickStats(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Days parameter cannot exceed 90',
      });
      expect(mockCalculateQuickStats).not.toHaveBeenCalled();
    });

    it('should return stats with empty data for new users', async () => {
      const mockStats = {
        period: {
          current: { start: '2025-11-15', end: '2025-11-21', days: 7 },
          previous: { start: '2025-11-08', end: '2025-11-14', days: 7 },
        },
        checkInCount: { current: 0, previous: 0, change: 0, percentChange: 0 },
        topSymptoms: [],
        averageSeverity: { current: 0, previous: 0, change: 0, trend: 'stable' as const },
      };

      mockCalculateQuickStats.mockResolvedValue(mockStats);

      await getQuickStats(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should call next with error when service throws', async () => {
      const error = new Error('Database error');
      mockCalculateQuickStats.mockRejectedValue(error);

      await getQuickStats(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
