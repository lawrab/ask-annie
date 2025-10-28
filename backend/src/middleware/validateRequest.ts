import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { logger } from '../utils/logger';

/**
 * Middleware factory to validate request body against a Joi schema
 */
export function validateRequest(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      logger.warn('Request validation failed', {
        errors: errorMessages,
        path: req.path,
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages,
      });
      return;
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
}
