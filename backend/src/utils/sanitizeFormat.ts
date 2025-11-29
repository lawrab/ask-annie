/**
 * Winston custom format for automatic PHI/PII sanitization
 * HIPAA Compliance: Ensures health information is never logged
 *
 * This formatter automatically sanitizes all log data before it's written,
 * making it a transparent cross-cutting concern with no code changes required.
 */

import winston from 'winston';

/**
 * PHI (Protected Health Information) field patterns
 * These are ALWAYS redacted in all environments per HIPAA
 */
const PHI_PATTERNS = [
  /symptom/i,
  /activities/i,
  /activity/i,
  /trigger/i,
  /transcript/i,
  /rawtranscript/i,
  /structured/i,
  /location/i, // body location
  /notes/i, // patient notes
  /severity/i,
  /parsed/i, // parsed health data
];

/**
 * PII (Personally Identifiable Information) field patterns
 * Redacted in production, visible in development for debugging
 */
const PII_PATTERNS = [/email/i, /password/i, /token/i, /magiclink/i, /username/i, /userid/i];

/**
 * Sensitive URL/path patterns that might contain PHI
 */
const URL_PHI_PATTERNS = [/symptom=/i, /activity=/i, /trigger=/i];

const REDACTED_PHI = '[REDACTED-PHI]';
const REDACTED_PII = '[REDACTED-PII]';

/**
 * Check if running in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Safe metadata suffixes that should NOT be redacted
 * These are counts, lengths, flags - metadata about PHI, not PHI itself
 */
const SAFE_METADATA_SUFFIXES = ['count', 'length', 'size', 'total', 'id', 'type'];

/**
 * Check if a field name matches PHI patterns
 * Excludes safe metadata fields like "symptomCount", "transcriptLength"
 */
function isPHIField(fieldName: string): boolean {
  const lowerName = fieldName.toLowerCase();

  // Check if this is safe metadata (e.g., symptomCount, transcriptLength)
  if (SAFE_METADATA_SUFFIXES.some((suffix) => lowerName.endsWith(suffix))) {
    return false;
  }

  return PHI_PATTERNS.some((pattern) => pattern.test(fieldName));
}

/**
 * Check if a field name matches PII patterns
 */
function isPIIField(fieldName: string): boolean {
  return PII_PATTERNS.some((pattern) => pattern.test(fieldName));
}

/**
 * Sanitize a URL or query string that might contain PHI
 */
function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') return url;

  for (const pattern of URL_PHI_PATTERNS) {
    if (pattern.test(url)) {
      // Redact query parameter values
      url = url.replace(/([?&])(symptom|activity|trigger)=[^&]*/gi, '$1$2=[REDACTED]');
    }
  }

  return url;
}

/**
 * Recursively sanitize an object
 * @param obj - Object to sanitize
 * @param depth - Current recursion depth (prevents infinite loops)
 * @returns Sanitized copy of the object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeObject(obj: any, depth = 0): any {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH]';
  }

  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  // Handle Error objects
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitizeObject(obj.message, depth + 1),
      stack: isDevelopment() ? obj.stack : '[REDACTED]',
    };
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  // Handle Objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Building object with dynamic keys from arbitrary log data
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if this field contains PHI (always redact)
    if (isPHIField(key)) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          sanitized[key] = `${REDACTED_PHI} (${value.length} items)`;
        } else {
          sanitized[key] = `${REDACTED_PHI} (object)`;
        }
      } else {
        sanitized[key] = REDACTED_PHI;
      }
      continue;
    }

    // Check if this field contains PII (redact in production only)
    if (isPIIField(key)) {
      if (isDevelopment()) {
        // In development, show partial data for debugging
        if (key.toLowerCase().includes('email') && typeof value === 'string') {
          const [local, domain] = value.split('@');
          if (domain) {
            const visibleChars = Math.min(3, local.length);
            sanitized[key] = `${local.substring(0, visibleChars)}***@${domain}`;
          } else {
            sanitized[key] = REDACTED_PII;
          }
        } else if (key.toLowerCase().includes('token') && typeof value === 'string') {
          sanitized[key] = value.substring(0, 8) + '...';
        } else if (key.toLowerCase().includes('userid')) {
          sanitized[key] = value; // Keep userIds in dev for debugging
        } else {
          sanitized[key] = REDACTED_PII;
        }
      } else {
        // In production, fully redact PII
        sanitized[key] = REDACTED_PII;
      }
      continue;
    }

    // Special handling for URLs/paths
    if ((key === 'url' || key === 'path') && typeof value === 'string') {
      sanitized[key] = sanitizeURL(value);
      continue;
    }

    // Recursively sanitize nested objects
    sanitized[key] = sanitizeObject(value, depth + 1);
  }

  return sanitized;
}

/**
 * Winston custom format for automatic sanitization
 * Usage: winston.format.combine(sanitizeFormat(), winston.format.json())
 */
export const sanitizeFormat = winston.format((info) => {
  // Define standard winston fields that should not be sanitized
  const standardFields = ['level', 'timestamp', 'service'];

  // Create a temporary object with all fields including message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Winston info object has dynamic structure
  const tempInfo: any = {};
  for (const key of Object.keys(info)) {
    tempInfo[key] = info[key];
  }

  // Sanitize the entire info object (which will recursively check all keys)
  const sanitized = sanitizeObject(tempInfo);

  // Preserve standard fields from original
  for (const field of standardFields) {
    if (info[field] !== undefined) {
      sanitized[field] = info[field];
    }
  }

  // Copy sanitized fields back to info
  for (const key of Object.keys(sanitized)) {
    info[key] = sanitized[key];
  }

  return info;
});
