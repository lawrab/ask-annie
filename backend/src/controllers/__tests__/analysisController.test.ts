import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { getSymptomsAnalysis, getSymptomTrend } from '../analysisController';
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
});
