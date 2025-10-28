import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validateRequest } from '../validateRequest';

describe('ValidateRequest Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      path: '/api/test',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('Valid Requests', () => {
    it('should call next() for valid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
      });

      mockReq.body = {
        name: 'John',
        age: 30,
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should strip unknown fields', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockReq.body = {
        name: 'John',
        unknown: 'should be removed',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body).toEqual({ name: 'John' });
      expect(mockReq.body).not.toHaveProperty('unknown');
    });

    it('should sanitize and transform data', () => {
      const schema = Joi.object({
        email: Joi.string().email().lowercase().required(),
      });

      mockReq.body = {
        email: 'USER@EXAMPLE.COM',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.email).toBe('user@example.com');
    });

    it('should handle nested objects', () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          age: Joi.number().required(),
        }).required(),
      });

      mockReq.body = {
        user: {
          name: 'John',
          age: 30,
        },
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle arrays', () => {
      const schema = Joi.object({
        tags: Joi.array().items(Joi.string()).required(),
      });

      mockReq.body = {
        tags: ['tag1', 'tag2', 'tag3'],
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Requests', () => {
    it('should return 400 for missing required field', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockReq.body = {};

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([expect.stringContaining('"name" is required')]),
      });
    });

    it('should return 400 for wrong type', () => {
      const schema = Joi.object({
        age: Joi.number().required(),
      });

      mockReq.body = {
        age: 'not a number',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([expect.stringContaining('"age" must be a number')]),
      });
    });

    it('should return all validation errors (abortEarly: false)', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
        email: Joi.string().email().required(),
      });

      mockReq.body = {};

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('"name" is required'),
          expect.stringContaining('"age" is required'),
          expect.stringContaining('"email" is required'),
        ]),
      });
    });

    it('should return 400 for invalid email format', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
      });

      mockReq.body = {
        email: 'not-an-email',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([expect.stringContaining('"email" must be a valid email')]),
      });
    });

    it('should return 400 for value out of range', () => {
      const schema = Joi.object({
        rating: Joi.number().min(1).max(5).required(),
      });

      mockReq.body = {
        rating: 10,
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid array items', () => {
      const schema = Joi.object({
        tags: Joi.array().items(Joi.string()).required(),
      });

      mockReq.body = {
        tags: ['valid', 123, 'another'],
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object validation', () => {
      const schema = Joi.object({});

      mockReq.body = { anything: 'goes' };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle optional fields', () => {
      const schema = Joi.object({
        required: Joi.string().required(),
        optional: Joi.string().optional(),
      });

      mockReq.body = {
        required: 'value',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle default values', () => {
      const schema = Joi.object({
        status: Joi.string().default('pending'),
      });

      mockReq.body = {};

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.status).toBe('pending');
    });
  });
});
