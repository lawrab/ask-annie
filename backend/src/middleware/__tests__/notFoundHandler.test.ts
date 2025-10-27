import { Request, Response } from 'express';
import { notFoundHandler } from '../notFoundHandler';

describe('NotFoundHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Setup request mock
    mockRequest = {
      originalUrl: '/api/nonexistent',
    };

    // Setup response mock
    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse);
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('should return 404 status code', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it('should return error message with original URL', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Route /api/nonexistent not found',
      },
    });
  });

  it('should handle different route URLs', () => {
    const testUrls = ['/api/users/123', '/api/checkins', '/invalid-endpoint', '/'];

    testUrls.forEach((url) => {
      jest.clearAllMocks();
      mockRequest.originalUrl = url;

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: `Route ${url} not found`,
        },
      });
    });
  });

  it('should return consistent JSON structure', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response);

    const response = jsonMock.mock.calls[0][0];
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('message');
    expect(typeof response.error.message).toBe('string');
  });

  it('should handle routes with query parameters', () => {
    mockRequest.originalUrl = '/api/users?search=test&limit=10';

    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Route /api/users?search=test&limit=10 not found',
      },
    });
  });

  it('should handle routes with special characters', () => {
    mockRequest.originalUrl = '/api/test%20space/special-chars_123';

    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('/api/test%20space/special-chars_123'),
        }),
      })
    );
  });
});
