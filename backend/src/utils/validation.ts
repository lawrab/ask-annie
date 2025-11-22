import Joi from 'joi';

/**
 * Joi validation schema for user registration
 */
export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).trim().required().messages({
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username must not exceed 30 characters',
    'any.required': 'Username is required',
  }),
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),
});

/**
 * Joi validation schema for user login
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Joi validation schema for manual check-in structured data
 */
export const manualCheckinSchema = Joi.object({
  structured: Joi.object({
    symptoms: Joi.object()
      .pattern(
        Joi.string(),
        Joi.object({
          severity: Joi.number().min(1).max(10).required(),
          location: Joi.string().optional(),
          notes: Joi.string().optional(),
        })
      )
      .required(),
    activities: Joi.array().items(Joi.string()).required(),
    triggers: Joi.array().items(Joi.string()).required(),
    notes: Joi.string().allow('').required(),
  }).required(),
});
