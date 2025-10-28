import Joi from 'joi';

/**
 * Joi validation schema for manual check-in structured data
 */
export const manualCheckinSchema = Joi.object({
  structured: Joi.object({
    symptoms: Joi.object()
      .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()))
      .required(),
    activities: Joi.array().items(Joi.string()).required(),
    triggers: Joi.array().items(Joi.string()).required(),
    notes: Joi.string().allow('').required(),
  }).required(),
});
