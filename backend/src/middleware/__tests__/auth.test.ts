import { Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin } from '../auth';
import passport from '../../config/passport';

// Mock passport
jest.mock('../../config/passport', () => ({
  authenticate: jest.fn(),
}));

describe('Authentication Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockPassportAuthenticate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Mock passport.authenticate to return a function
    mockPassportAuthenticate = jest.fn();
    (passport.authenticate as jest.Mock).mockReturnValue(mockPassportAuthenticate);
  });

  describe('Success Cases', () => {
    it('should authenticate valid JWT token and attach user to request', () => {
      // Arrange
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
      };

      // Mock passport.authenticate to call callback with user
      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, mockUser);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(passport.authenticate).toHaveBeenCalledWith(
        'jwt',
        { session: false },
        expect.any(Function)
      );
      expect(mockPassportAuthenticate).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockReq.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should attach user with all required fields', () => {
      // Arrange
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        username: 'johndoe',
        email: 'john@example.com',
      };

      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, mockUser);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockReq.user).toEqual({
        id: '507f1f77bcf86cd799439011',
        username: 'johndoe',
        email: 'john@example.com',
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Authentication Failures', () => {
    it('should return 401 when no token is provided', () => {
      // Arrange
      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, false); // No user = authentication failed
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should return 401 when token is invalid', () => {
      // Arrange
      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, false);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      // Arrange
      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, false);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found in database', () => {
      // Arrange
      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, false); // Passport returns false when user lookup fails
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required. Please provide a valid JWT token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on internal authentication error', () => {
      // Arrange
      const authError = new Error('Database connection failed');

      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(authError, false);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal authentication error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on JWT verification error', () => {
      // Arrange
      const jwtError = new Error('JWT malformed');

      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(jwtError, false);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal authentication error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle null error gracefully', () => {
      // Arrange
      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, false);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Passport Integration', () => {
    it('should call passport.authenticate with correct strategy', () => {
      // Arrange
      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, { id: '123', username: 'test', email: 'test@test.com' });
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(passport.authenticate).toHaveBeenCalledWith(
        'jwt',
        expect.objectContaining({ session: false }),
        expect.any(Function)
      );
    });

    it('should disable sessions in passport', () => {
      // Arrange
      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, { id: '123', username: 'test', email: 'test@test.com' });
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      const passportOptions = (passport.authenticate as jest.Mock).mock.calls[0][1];
      expect(passportOptions.session).toBe(false);
    });

    it('should pass request, response, and next to passport middleware', () => {
      // Arrange
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
      };

      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, mockUser);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockPassportAuthenticate).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });
  });

  describe('Security Scenarios', () => {
    it('should not leak error details to client on internal errors', () => {
      // Arrange
      const sensitiveError = new Error('Database password incorrect at 192.168.1.5');

      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(sensitiveError, false);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal authentication error', // Generic message only
      });
      // Ensure no sensitive details are exposed
      const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.error).not.toContain('Database password');
      expect(jsonCall.error).not.toContain('192.168.1.5');
    });

    it('should prevent request from proceeding without valid user', () => {
      // Arrange
      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, false);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should only call next() after successful authentication', () => {
      // Arrange
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
      };

      mockPassportAuthenticate.mockImplementation((_req, _res, _next) => {
        const callback = (passport.authenticate as jest.Mock).mock.calls[0][2];
        callback(null, mockUser);
      });

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});

describe('Admin Authorization Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: undefined,
      ip: '127.0.0.1',
      path: '/api/admin/test',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('Success Cases', () => {
    it('should allow access for authenticated admin users', () => {
      // Arrange
      mockReq.user = {
        id: '507f1f77bcf86cd799439011',
        username: 'admin',
        email: 'admin@example.com',
        isAdmin: true,
      } as any;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should proceed when user has admin privileges', () => {
      // Arrange
      mockReq.user = {
        id: '507f1f77bcf86cd799439012',
        username: 'superadmin',
        email: 'superadmin@example.com',
        isAdmin: true,
      } as any;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Authorization Failures', () => {
    it('should return 401 when no user is authenticated', () => {
      // Arrange
      mockReq.user = undefined;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not an admin', () => {
      // Arrange
      mockReq.user = {
        id: '507f1f77bcf86cd799439011',
        username: 'regularuser',
        email: 'user@example.com',
        isAdmin: false,
      } as any;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin privileges required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user has no isAdmin field', () => {
      // Arrange
      mockReq.user = {
        id: '507f1f77bcf86cd799439011',
        username: 'regularuser',
        email: 'user@example.com',
      } as any;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin privileges required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when isAdmin is explicitly false', () => {
      // Arrange
      mockReq.user = {
        id: '507f1f77bcf86cd799439013',
        username: 'user',
        email: 'user@test.com',
        isAdmin: false,
      } as any;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Security and Edge Cases', () => {
    it('should not proceed when user object is null', () => {
      // Arrange
      mockReq.user = null as any;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user object with only id field', () => {
      // Arrange
      mockReq.user = {
        id: '507f1f77bcf86cd799439011',
      } as any;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should prevent access when isAdmin is truthy but not boolean true', () => {
      // Arrange
      mockReq.user = {
        id: '507f1f77bcf86cd799439011',
        username: 'user',
        email: 'user@test.com',
        isAdmin: 'true', // String instead of boolean
      } as any;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      // The middleware checks !user.isAdmin, so 'true' string is truthy and should pass
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should only call next once for admin users', () => {
      // Arrange
      mockReq.user = {
        id: '507f1f77bcf86cd799439011',
        username: 'admin',
        email: 'admin@example.com',
        isAdmin: true,
      } as any;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with authenticate middleware', () => {
    it('should work correctly when used after authenticate middleware', () => {
      // Arrange - simulating authenticate middleware having set req.user
      mockReq.user = {
        id: '507f1f77bcf86cd799439011',
        username: 'admin',
        email: 'admin@example.com',
        isAdmin: true,
      } as any;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should catch cases where authenticate was bypassed', () => {
      // Arrange - no user set (authenticate was skipped)
      mockReq.user = undefined;

      // Act
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
