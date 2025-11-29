import Joi from 'joi';
import { AUTH_CONSTANTS, VALIDATION_CONSTANTS } from '../constants';

/**
 * Joi validation schema for user registration
 */
export const registerSchema = Joi.object({
  username: Joi.string()
    .min(VALIDATION_CONSTANTS.MIN_USERNAME_LENGTH)
    .max(VALIDATION_CONSTANTS.MAX_USERNAME_LENGTH)
    .trim()
    .required()
    .messages({
      'string.min': `Username must be at least ${VALIDATION_CONSTANTS.MIN_USERNAME_LENGTH} characters`,
      'string.max': `Username must not exceed ${VALIDATION_CONSTANTS.MAX_USERNAME_LENGTH} characters`,
      'any.required': 'Username is required',
    }),
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters`,
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
          severity: Joi.number()
            .min(VALIDATION_CONSTANTS.MIN_SYMPTOM_SEVERITY)
            .max(VALIDATION_CONSTANTS.MAX_SYMPTOM_SEVERITY)
            .required(),
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

/**
 * Joi validation schema for magic link request
 * Accepts optional username for new user registration
 */
export const magicLinkRequestSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  username: Joi.string()
    .min(VALIDATION_CONSTANTS.MIN_USERNAME_LENGTH)
    .max(VALIDATION_CONSTANTS.MAX_USERNAME_LENGTH)
    .trim()
    .optional()
    .messages({
      'string.min': `Username must be at least ${VALIDATION_CONSTANTS.MIN_USERNAME_LENGTH} characters`,
      'string.max': `Username must not exceed ${VALIDATION_CONSTANTS.MAX_USERNAME_LENGTH} characters`,
    }),
});

/**
 * Joi validation schema for magic link verification
 */
export const magicLinkVerifySchema = Joi.object({
  token: Joi.string().length(64).hex().required().messages({
    'string.length': 'Invalid token format',
    'string.hex': 'Invalid token format',
    'any.required': 'Token is required',
  }),
});
