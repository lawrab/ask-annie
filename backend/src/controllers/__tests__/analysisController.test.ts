import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { getSymptomsAnalysis } from '../analysisController';
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

  beforeEach(() => {
    mockRequest = {
      user: { id: 'user123', username: 'testuser', email: 'test@example.com' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as unknown as Response['status'],
      json: jest.fn() as unknown as Response['json'],
    };

    mockNext = jest.fn() as NextFunction;

    mockAnalyzeSymptomsForUser = analysisService.analyzeSymptomsForUser as jest.MockedFunction<
      typeof analysisService.analyzeSymptomsForUser
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
});
