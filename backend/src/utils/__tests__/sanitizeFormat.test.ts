/**
 * Unit tests for Winston sanitization formatter
 * Ensures PHI/PII is properly redacted from logs
 */

import { sanitizeFormat } from '../sanitizeFormat';
import { TransformableInfo } from 'logform';

describe('sanitizeFormat', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  // Helper to transform log info with sanitization

  function sanitize(logInfo: any): any {
    const formatter = sanitizeFormat();
    const result = formatter.transform(logInfo as TransformableInfo);
    if (!result) throw new Error('Transform returned false');
    return result;
  }

  describe('PHI Redaction (HIPAA Compliance)', () => {
    it('should redact symptoms data', () => {
      const result = sanitize({
        level: 'info',
        message: 'Processing check-in',
        symptoms: { headache: { severity: 7 }, nausea: { severity: 5 } },
      });

      expect(result.symptoms).toBe('[REDACTED-PHI] (object)');
    });

    it('should redact activities data', () => {
      const result = sanitize({
        level: 'info',
        message: 'Processing check-in',
        activities: ['walking', 'working'],
      });

      expect(result.activities).toBe('[REDACTED-PHI] (2 items)');
    });

    it('should redact triggers data', () => {
      const result = sanitize({
        level: 'info',
        message: 'Processing check-in',
        triggers: ['stress', 'lack of sleep'],
      });

      expect(result.triggers).toBe('[REDACTED-PHI] (2 items)');
    });

    it('should redact transcript data', () => {
      const result = sanitize({
        level: 'info',
        message: 'Transcription completed',
        rawTranscript: 'I have a bad headache today',
        transcriptLength: 28,
      });

      expect(result.rawTranscript).toBe('[REDACTED-PHI]');
      expect(result.transcriptLength).toBe(28);
    });

    it('should redact structured health data', () => {
      const result = sanitize({
        level: 'info',
        message: 'Saving check-in',
        structured: {
          symptoms: { headache: { severity: 7 } },
          activities: ['walking'],
          triggers: ['stress'],
          notes: 'Feeling unwell',
        },
      });

      expect(result.structured).toBe('[REDACTED-PHI] (object)');
    });

    it('should redact PHI in nested objects', () => {
      const result = sanitize({
        level: 'info',
        message: 'Processing',
        data: {
          userId: '123',
          checkIn: {
            symptoms: { headache: { severity: 7 } },
            timestamp: '2025-01-01',
          },
        },
      });

      expect(result.data.checkIn.symptoms).toBe('[REDACTED-PHI] (object)');
      expect(result.data.checkIn.timestamp).toBe('2025-01-01');
    });
  });

  describe('PII Redaction', () => {
    describe('Production Environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('should fully redact email addresses', () => {
        const result = sanitize({
          level: 'info',
          message: 'User login',
          email: 'user@example.com',
        });

        expect(result.email).toBe('[REDACTED-PII]');
      });

      it('should fully redact tokens', () => {
        const result = sanitize({
          level: 'info',
          message: 'Magic link sent',
          token: 'abc123def456ghi789',
        });

        expect(result.token).toBe('[REDACTED-PII]');
      });

      it('should fully redact userIds', () => {
        const result = sanitize({
          level: 'info',
          message: 'Fetching data',
          userId: '507f1f77bcf86cd799439011',
        });

        expect(result.userId).toBe('[REDACTED-PII]');
      });
    });

    describe('Development Environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('should partially show email addresses', () => {
        const result = sanitize({
          level: 'info',
          message: 'User login',
          email: 'user@example.com',
        });

        expect(result.email).toBe('use***@example.com');
      });

      it('should partially show tokens', () => {
        const result = sanitize({
          level: 'info',
          message: 'Magic link sent',
          token: 'abc123def456ghi789',
        });

        expect(result.token).toBe('abc123de...');
      });

      it('should show userIds for debugging', () => {
        const result = sanitize({
          level: 'info',
          message: 'Fetching data',
          userId: '507f1f77bcf86cd799439011',
        });

        expect(result.userId).toBe('507f1f77bcf86cd799439011');
      });
    });
  });

  describe('URL/Query Sanitization', () => {
    it('should sanitize URLs with symptom query params', () => {
      const result = sanitize({
        level: 'info',
        message: 'API request',
        url: '/api/checkins?symptom=headache&symptom=nausea&limit=10',
      });

      expect(result.url).toContain('symptom=[REDACTED]');
      expect(result.url).toContain('limit=10');
      expect(result.url).not.toContain('headache');
      expect(result.url).not.toContain('nausea');
    });

    it('should sanitize URLs with activity query params', () => {
      const result = sanitize({
        level: 'info',
        message: 'API request',
        url: '/api/checkins?activity=walking&limit=20',
      });

      expect(result.url).toContain('activity=[REDACTED]');
      expect(result.url).toContain('limit=20');
      expect(result.url).not.toContain('walking');
    });

    it('should sanitize URLs with trigger query params', () => {
      const result = sanitize({
        level: 'info',
        message: 'API request',
        url: '/api/checkins?trigger=stress&offset=0',
      });

      expect(result.url).toContain('trigger=[REDACTED]');
      expect(result.url).toContain('offset=0');
      expect(result.url).not.toContain('stress');
    });
  });

  describe('Complex Object Sanitization', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should sanitize deeply nested objects', () => {
      const result = sanitize({
        level: 'info',
        message: 'Processing',
        data: {
          user: {
            email: 'user@example.com',
            profile: {
              symptoms: { headache: { severity: 7 } },
            },
          },
        },
      });

      expect(result.data.user.email).toBe('[REDACTED-PII]');
      expect(result.data.user.profile.symptoms).toBe('[REDACTED-PHI] (object)');
    });

    it('should sanitize arrays of objects', () => {
      const result = sanitize({
        level: 'info',
        message: 'Batch processing',
        users: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' },
        ],
      });

      expect(result.users[0].email).toBe('[REDACTED-PII]');
      expect(result.users[1].email).toBe('[REDACTED-PII]');
      expect(result.users[0].name).toBe('User 1');
      expect(result.users[1].name).toBe('User 2');
    });

    it('should handle null and undefined values', () => {
      const result = sanitize({
        level: 'info',
        message: 'Processing',
        nullValue: null,
        undefinedValue: undefined,
        symptoms: null,
      });

      expect(result.nullValue).toBeNull();
      expect(result.undefinedValue).toBeUndefined();
      expect(result.symptoms).toBe('[REDACTED-PHI]');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should sanitize Error objects', () => {
      const error = new Error('Database error: user@example.com failed');
      const result = sanitize({
        level: 'error',
        message: 'Error occurred',
        error,
      });

      expect(result.error.name).toBe('Error');
      expect(result.error.message).toBe('Database error: user@example.com failed');
      expect(result.error.stack).toBe('[REDACTED]');
    });

    it('should show stack traces in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      const result = sanitize({
        level: 'error',
        message: 'Error occurred',
        error,
      });

      expect(result.error.stack).toBeDefined();
      expect(result.error.stack).not.toBe('[REDACTED]');
    });
  });

  describe('Special Cases', () => {
    it('should preserve standard winston fields', () => {
      const result = sanitize({
        level: 'info',
        message: 'Test message',
        timestamp: '2025-01-01T12:00:00Z',
        service: 'test-service',
      });

      expect(result.level).toBe('info');
      expect(result.message).toBe('Test message');
      expect(result.timestamp).toBe('2025-01-01T12:00:00Z');
      expect(result.service).toBe('test-service');
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-01-01T12:00:00Z');
      const result = sanitize({
        level: 'info',
        message: 'Date test',
        createdAt: date,
      });

      expect(result.createdAt).toEqual(date);
    });
  });

  describe('Real-world Scenarios', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should sanitize check-in creation log', () => {
      const result = sanitize({
        level: 'info',
        message: 'Check-in saved successfully',
        checkInId: '507f1f77bcf86cd799439011',
        checkInType: 'with-symptoms',
        symptomCount: 2,
        activityCount: 1,
        structured: {
          symptoms: { headache: { severity: 7 }, nausea: { severity: 5 } },
          activities: ['walking'],
          triggers: ['stress'],
          notes: 'Feeling unwell',
        },
      });

      expect(result.checkInId).toBe('507f1f77bcf86cd799439011');
      expect(result.checkInType).toBe('with-symptoms');
      expect(result.symptomCount).toBe(2);
      expect(result.activityCount).toBe(1);
      expect(result.structured).toBe('[REDACTED-PHI] (object)');
    });

    it('should sanitize authentication log', () => {
      const result = sanitize({
        level: 'info',
        message: 'Magic link sent successfully',
        email: 'user@example.com',
        expiryMinutes: 15,
      });

      expect(result.email).toBe('[REDACTED-PII]');
      expect(result.expiryMinutes).toBe(15);
    });

    it('should sanitize query log with mixed PHI and safe params', () => {
      const result = sanitize({
        level: 'info',
        message: 'Fetching check-ins',
        query: {
          symptom: ['headache', 'nausea'],
          activity: 'walking',
          limit: 20,
          offset: 0,
          sortBy: 'timestamp',
          sortOrder: 'desc',
        },
      });

      expect(result.query.symptom).toBe('[REDACTED-PHI] (2 items)');
      expect(result.query.activity).toBe('[REDACTED-PHI]');
      expect(result.query.limit).toBe(20);
      expect(result.query.offset).toBe(0);
      expect(result.query.sortBy).toBe('timestamp');
      expect(result.query.sortOrder).toBe('desc');
    });
  });
});
