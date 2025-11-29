import { z } from 'zod';
import { logger } from '../utils/logger';

// Environment validation schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').pipe(z.string().regex(/^\d+$/)).transform(Number),

  // Database
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid MongoDB connection string'),

  // Authentication
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .describe('Secret key for signing JWT tokens'),

  // CORS
  ALLOWED_ORIGINS: z
    .string()
    .min(1, 'ALLOWED_ORIGINS must contain at least one origin')
    .describe('Comma-separated list of allowed CORS origins'),

  // OpenAI API (optional but recommended)
  OPENAI_API_KEY: z
    .string()
    .optional()
    .describe('OpenAI API key for Whisper transcription and GPT parsing'),

  // Whisper Service (optional - fallback if OpenAI not used)
  WHISPER_URL: z
    .string()
    .url()
    .optional()
    .describe('URL for self-hosted Whisper transcription service'),
  WHISPER_MODEL: z.string().optional().describe('Whisper model identifier'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),

  // Magic Link Authentication
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required for magic link authentication'),
  FROM_EMAIL: z
    .string()
    .email('FROM_EMAIL must be a valid email address')
    .or(z.string().regex(/^.+<.+@.+>$/, 'FROM_EMAIL must be in format "Name <email@example.com>"')),
  MAGIC_LINK_BASE_URL: z
    .string()
    .url('MAGIC_LINK_BASE_URL must be a valid URL (e.g., http://localhost:5173)'),
  MAGIC_LINK_EXPIRY_MINUTES: z
    .string()
    .default('15')
    .pipe(z.string().regex(/^\d+$/))
    .transform(Number),

  // WebAuthn/Passkey Configuration
  RP_ID: z
    .string()
    .min(1, 'RP_ID is required for passkey authentication')
    .describe('Relying Party ID - must match your domain (e.g., www.yourdomain.com)'),
  RP_NAME: z.string().default("Annie's Health Journal"),
  WEBAUTHN_ORIGIN: z
    .string()
    .url('WEBAUTHN_ORIGIN must be a valid URL with protocol (e.g., https://www.yourdomain.com)')
    .describe('Full URL where users access the app'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables on application startup.
 * Exits process with error if validation fails.
 * @returns Validated and typed environment variables
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);

    // Additional validation warnings (non-fatal)
    if (env.NODE_ENV === 'production') {
      if (!env.OPENAI_API_KEY && !env.WHISPER_URL) {
        logger.warn(
          '⚠️  Neither OPENAI_API_KEY nor WHISPER_URL is set. Voice transcription will fail.'
        );
      }

      if (env.JWT_SECRET.length < 64) {
        logger.warn(
          '⚠️  JWT_SECRET is less than 64 characters. Consider using a longer secret in production.'
        );
      }

      if (env.RP_ID === 'localhost' || env.WEBAUTHN_ORIGIN.includes('localhost')) {
        logger.error('❌ RP_ID and WEBAUTHN_ORIGIN must not use localhost in production!');
        logger.error('   Set RP_ID to your domain (e.g., www.yourdomain.com)');
        logger.error('   Set WEBAUTHN_ORIGIN to your full URL (e.g., https://www.yourdomain.com)');
        process.exit(1);
      }
    }

    logger.info('✅ Environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('❌ Environment variable validation failed:');
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        logger.error(`   ${path}: ${err.message}`);
      });
      logger.error('\n💡 Check your .env file and compare with .env.example');
      process.exit(1);
    }
    throw error;
  }
}

// Export validated environment singleton
export const env = validateEnv();
