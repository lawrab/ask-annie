import mongoose from 'mongoose';
import CheckIn from '../CheckIn';

const testUserId = new mongoose.Types.ObjectId();

describe('CheckIn Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid check-in with all required fields', () => {
      const validCheckIn = {
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test transcript',
        structured: {
          symptoms: { headache: 5, fatigue: 7 },
          activities: ['walking', 'reading'],
          triggers: ['stress'],
          notes: 'Feeling tired today',
        },
      };

      const checkIn = new CheckIn(validCheckIn);

      expect(checkIn.userId).toEqual(testUserId);
      expect(checkIn.timestamp).toEqual(validCheckIn.timestamp);
      expect(checkIn.rawTranscript).toBe(validCheckIn.rawTranscript);
      expect(checkIn.flaggedForDoctor).toBe(false); // default
    });

    it('should fail validation without userId', () => {
      const checkInWithoutUserId = new CheckIn({
        timestamp: new Date(),
        rawTranscript: 'Test transcript',
      });

      const error = checkInWithoutUserId.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.userId).toBeDefined();
    });

    it('should fail validation without timestamp', () => {
      const checkInWithoutTimestamp = new CheckIn({
        userId: testUserId,
        rawTranscript: 'Test transcript',
      });

      const error = checkInWithoutTimestamp.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.timestamp).toBeDefined();
    });

    it('should use default "manual entry" for rawTranscript', () => {
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
      });

      expect(checkIn.rawTranscript).toBe('manual entry');
    });
  });

  describe('Flexible Symptoms Storage', () => {
    it('should store symptoms as flexible key-value pairs', () => {
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test',
        structured: {
          symptoms: {
            headache: 5,
            nausea: 3,
            'custom-symptom': 'moderate',
            'another-symptom': { severity: 7, location: 'lower back' },
          },
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      expect(checkIn.structured).toBeDefined();
      expect(checkIn.structured.symptoms).toBeDefined();
      const symptoms = checkIn.structured.symptoms as unknown as Map<string, unknown>;
      expect(symptoms.get('headache')).toBe(5);
      expect(symptoms.get('nausea')).toBe(3);
      expect(symptoms.get('custom-symptom')).toBe('moderate');
    });

    it('should handle empty symptoms', () => {
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test',
        structured: {
          symptoms: {},
          activities: [],
          triggers: [],
          notes: '',
        },
      });

      const symptoms = checkIn.structured.symptoms as unknown as Map<string, unknown>;
      expect(symptoms.size).toBe(0);
    });

    it('should default to empty symptoms if not provided', () => {
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test',
      });

      expect(checkIn.structured).toBeDefined();
      expect(checkIn.structured.symptoms).toBeDefined();
    });
  });

  describe('Activities and Triggers', () => {
    it('should store activities as array', () => {
      const activities = ['exercise', 'meditation', 'walking'];
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test',
        structured: {
          symptoms: {},
          activities,
          triggers: [],
          notes: '',
        },
      });

      expect(checkIn.structured.activities).toEqual(activities);
    });

    it('should store triggers as array', () => {
      const triggers = ['stress', 'lack of sleep', 'weather change'];
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test',
        structured: {
          symptoms: {},
          activities: [],
          triggers,
          notes: '',
        },
      });

      expect(checkIn.structured.triggers).toEqual(triggers);
    });

    it('should default to empty arrays', () => {
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test',
      });

      expect(checkIn.structured.activities).toEqual([]);
      expect(checkIn.structured.triggers).toEqual([]);
    });
  });

  describe('Doctor Flagging', () => {
    it('should default flaggedForDoctor to false', () => {
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test',
      });

      expect(checkIn.flaggedForDoctor).toBe(false);
    });

    it('should allow flagging for doctor', () => {
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test',
        flaggedForDoctor: true,
      });

      expect(checkIn.flaggedForDoctor).toBe(true);
    });
  });

  describe('Schema Properties', () => {
    it('should have correct schema structure', () => {
      const schema = CheckIn.schema;

      expect(schema.path('userId')).toBeDefined();
      expect(schema.path('timestamp')).toBeDefined();
      expect(schema.path('rawTranscript')).toBeDefined();
      expect(schema.path('structured.symptoms')).toBeDefined();
      expect(schema.path('flaggedForDoctor')).toBeDefined();
    });

    it('should have timestamps enabled', () => {
      const schema = CheckIn.schema;
      expect(schema.path('createdAt')).toBeDefined();
      expect(schema.path('updatedAt')).toBeDefined();
    });

    it('should have userId as reference to User', () => {
      const userIdPath = CheckIn.schema.path('userId') as any;
      expect(userIdPath).toBeDefined();
      expect(userIdPath.options?.ref).toBe('User');
    });
  });

  describe('Schema Validation Rules', () => {
    it('should have required validators', () => {
      const schema = CheckIn.schema;

      const userIdValidators = schema.path('userId').validators;
      const timestampValidators = schema.path('timestamp').validators;

      expect(userIdValidators.some((v: any) => v.type === 'required')).toBe(true);
      expect(timestampValidators.some((v: any) => v.type === 'required')).toBe(true);
    });

    it('should have structured.symptoms as a Map', () => {
      const symptomsPath = CheckIn.schema.path('structured.symptoms');
      expect(symptomsPath).toBeDefined();
      expect((symptomsPath as any).instance).toBe('Map');
    });
  });

  describe('Indexes', () => {
    it('should have index configuration on schema', () => {
      const schema = CheckIn.schema;

      // Check that schema has index definitions
      const indexes = schema.indexes();
      expect(indexes).toBeDefined();
      expect(Array.isArray(indexes)).toBe(true);
      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should have userId in indexes', () => {
      const indexes = CheckIn.schema.indexes();
      const hasUserIdIndex = indexes.some((index: any) => {
        const fields = Object.keys(index[0]);
        return fields.includes('userId');
      });
      expect(hasUserIdIndex).toBe(true);
    });

    it('should have timestamp in indexes', () => {
      const indexes = CheckIn.schema.indexes();
      const hasTimestampIndex = indexes.some((index: any) => {
        const fields = Object.keys(index[0]);
        return fields.includes('timestamp');
      });
      expect(hasTimestampIndex).toBe(true);
    });
  });

  describe('Notes Field', () => {
    it('should store notes in structured data', () => {
      const notes = 'Feeling much better today after rest';
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test',
        structured: {
          symptoms: {},
          activities: [],
          triggers: [],
          notes,
        },
      });

      expect(checkIn.structured.notes).toBe(notes);
    });

    it('should default notes to empty string', () => {
      const checkIn = new CheckIn({
        userId: testUserId,
        timestamp: new Date(),
        rawTranscript: 'Test',
      });

      expect(checkIn.structured.notes).toBe('');
    });
  });
});
