import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../errorHandler';
import { logger } from '../../utils/logger';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request mock
    mockRequest = {
      path: '/api/test',
      method: 'GET',
    };

    // Setup response mock
    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse);
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe('AppError Class', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('Test error message', 400);

      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 404);

      expect(error.stack).toBeDefined();
    });
  });

  describe('errorHandler Function', () => {
    it('should handle AppError with custom status code and message', () => {
      const appError = new AppError('Custom error message', 400);

      errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Custom error message',
        },
      });
      expect(logger.error).toHaveBeenCalledWith('Error occurred:', {
        message: 'Custom error message',
        stack: appError.stack,
        statusCode: 400,
        path: '/api/test',
        method: 'GET',
      });
    });

    it('should handle generic Error with 500 status code', () => {
      const genericError = new Error('Generic error');

      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
        },
      });
    });

    it('should log error details', () => {
      const error = new AppError('Test error', 403);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          message: 'Test error',
          statusCode: 403,
          path: '/api/test',
          method: 'GET',
        })
      );
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Dev error');
      error.stack = 'Test stack trace';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          stack: 'Test stack trace',
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Prod error');
      error.stack = 'Test stack trace';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle different status codes correctly', () => {
      const testCases = [
        { statusCode: 400, message: 'Bad Request' },
        { statusCode: 401, message: 'Unauthorized' },
        { statusCode: 403, message: 'Forbidden' },
        { statusCode: 404, message: 'Not Found' },
        { statusCode: 500, message: 'Internal Server Error' },
      ];

      testCases.forEach(({ statusCode, message }) => {
        jest.clearAllMocks();
        const error = new AppError(message, statusCode);

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(statusCode);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              message,
            }),
          })
        );
      });
    });

    it('should handle errors without a message', () => {
      const error = new Error();

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
        },
      });
    });
  });
});
