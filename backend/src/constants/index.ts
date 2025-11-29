/**
 * Application Constants
 *
 * Centralized constants for maintainability and self-documentation.
 * Magic numbers are replaced with named constants to make code more readable.
 */

// Authentication & Security
export const AUTH_CONSTANTS = {
  /** Magic link expiry time in minutes */
  MAGIC_LINK_EXPIRY_MINUTES: 15,

  /** JWT token expiry time in days */
  JWT_EXPIRY_DAYS: 7,

  /** Minimum JWT secret length for security (characters) */
  MIN_JWT_SECRET_LENGTH: 32,

  /** Recommended JWT secret length for production (characters) */
  RECOMMENDED_JWT_SECRET_LENGTH: 64,

  /** Token length in bytes for random tokens (magic link, deletion) */
  TOKEN_LENGTH_BYTES: 32,

  /** Maximum failed login attempts before rate limit */
  MAX_LOGIN_ATTEMPTS: 3,

  /** Rate limit window in minutes for failed attempts */
  RATE_LIMIT_WINDOW_MINUTES: 15,

  /** Maximum magic link requests per IP in production */
  MAX_MAGIC_LINK_REQUESTS: 5,

  /** Minimum password length for password-based auth */
  MIN_PASSWORD_LENGTH: 8,
} as const;

// Validation Constraints
export const VALIDATION_CONSTANTS = {
  /** Minimum username length */
  MIN_USERNAME_LENGTH: 2,

  /** Maximum username length */
  MAX_USERNAME_LENGTH: 50,

  /** Maximum length for check-in notes */
  MAX_NOTES_LENGTH: 5000,

  /** Minimum symptom severity value */
  MIN_SYMPTOM_SEVERITY: 1,

  /** Maximum symptom severity value */
  MAX_SYMPTOM_SEVERITY: 10,

  /** Severity threshold for "high" severity */
  HIGH_SEVERITY_THRESHOLD: 7,

  /** Severity threshold for "moderate" severity */
  MODERATE_SEVERITY_THRESHOLD: 4,
} as const;

// Pagination & Limits
export const PAGINATION_CONSTANTS = {
  /** Default number of items per page */
  DEFAULT_PAGE_SIZE: 20,

  /** Maximum number of items per page */
  MAX_PAGE_SIZE: 100,

  /** Default number of recent check-ins to show */
  DEFAULT_RECENT_CHECKINS: 10,
} as const;

// Insight Scoring (from insightService.ts)
export const INSIGHT_SCORING = {
  /** Base score for any check-in */
  BASE_SCORE: 10,

  /** Points per symptom (capped) */
  POINTS_PER_SYMPTOM: 15,

  /** Maximum points from symptom count */
  MAX_SYMPTOM_POINTS: 60,

  /** Points per activity (capped) */
  POINTS_PER_ACTIVITY: 5,

  /** Maximum points from activity count */
  MAX_ACTIVITY_POINTS: 25,

  /** Points per trigger (capped) */
  POINTS_PER_TRIGGER: 10,

  /** Maximum points from trigger count */
  MAX_TRIGGER_POINTS: 30,

  /** Bonus points for notes */
  NOTES_BONUS: 10,

  /** Bonus points for severe symptoms (severity >= 7) */
  SEVERE_SYMPTOM_BONUS: 20,

  /** Severity threshold for severe symptoms */
  SEVERE_THRESHOLD: 7,

  /** Maximum total insight score */
  MAX_TOTAL_SCORE: 100,
} as const;

// Time Windows (in days)
export const TIME_WINDOWS = {
  /** Number of days for daily check-in status */
  DAILY_STATUS_DAYS: 1,

  /** Grace period for "on track" status (hours) */
  GRACE_PERIOD_HOURS: 4,

  /** Number of days for week-over-week comparison */
  WEEK_COMPARISON_DAYS: 7,

  /** Number of days for monthly trend analysis */
  MONTHLY_TREND_DAYS: 30,

  /** Number of days for quarterly analysis */
  QUARTERLY_TREND_DAYS: 90,
} as const;

// Rate Limiting (Global)
export const RATE_LIMIT = {
  /** General API rate limit (requests per window) */
  MAX_REQUESTS: 100,

  /** Rate limit window in minutes */
  WINDOW_MINUTES: 15,
} as const;

// File Upload
export const UPLOAD_CONSTANTS = {
  /** Maximum file size for audio uploads (10MB in bytes) */
  MAX_AUDIO_FILE_SIZE: 10 * 1024 * 1024,

  /** Allowed audio MIME types */
  ALLOWED_AUDIO_TYPES: ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg'],
} as const;

// Export all constants as a single object for convenience
export const CONSTANTS = {
  AUTH: AUTH_CONSTANTS,
  VALIDATION: VALIDATION_CONSTANTS,
  PAGINATION: PAGINATION_CONSTANTS,
  INSIGHT: INSIGHT_SCORING,
  TIME: TIME_WINDOWS,
  RATE_LIMIT,
  UPLOAD: UPLOAD_CONSTANTS,
} as const;
