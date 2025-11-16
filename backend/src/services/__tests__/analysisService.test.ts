import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import CheckIn from '../../models/CheckIn';
import { analyzeSymptomsForUser, SymptomValueType } from '../analysisService';

// Mock the CheckIn model
jest.mock('../../models/CheckIn');

describe('Analysis Service', () => {
  const userId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockFind = (mockCheckIns: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CheckIn.find as any).mockReturnValue({
      sort: jest.fn(async () => mockCheckIns),
    });
  };

  describe('analyzeSymptomsForUser', () => {
    it('should return empty array for user with no check-ins', async () => {
      mockFind([]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.symptoms).toEqual([]);
      expect(result.totalCheckins).toBe(0);
    });

    it('should analyze numeric symptoms correctly', async () => {
      mockFind([
        {
          structured: { symptoms: { pain_level: 5 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { pain_level: 7 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { pain_level: 3 }, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(3);
      expect(result.symptoms).toHaveLength(1);

      const painSymptom = result.symptoms[0];
      expect(painSymptom.name).toBe('pain_level');
      expect(painSymptom.count).toBe(3);
      expect(painSymptom.percentage).toBe(100);
      expect(painSymptom.type).toBe(SymptomValueType.NUMERIC);
      expect(painSymptom.min).toBe(3);
      expect(painSymptom.max).toBe(7);
      expect(painSymptom.average).toBe(5);
    });

    it('should analyze categorical symptoms correctly', async () => {
      mockFind([
        {
          structured: { symptoms: { mood: 'good' }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { mood: 'bad' }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { mood: 'moderate' }, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(3);
      expect(result.symptoms).toHaveLength(1);

      const moodSymptom = result.symptoms[0];
      expect(moodSymptom.name).toBe('mood');
      expect(moodSymptom.count).toBe(3);
      expect(moodSymptom.percentage).toBe(100);
      expect(moodSymptom.type).toBe(SymptomValueType.CATEGORICAL);
      expect(moodSymptom.values).toEqual(expect.arrayContaining(['good', 'bad', 'moderate']));
      expect(moodSymptom.min).toBeUndefined();
      expect(moodSymptom.max).toBeUndefined();
      expect(moodSymptom.average).toBeUndefined();
    });

    it('should analyze boolean symptoms correctly', async () => {
      mockFind([
        {
          structured: { symptoms: { headache: true }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { headache: false }, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(2);
      expect(result.symptoms).toHaveLength(1);

      const headacheSymptom = result.symptoms[0];
      expect(headacheSymptom.name).toBe('headache');
      expect(headacheSymptom.count).toBe(2);
      expect(headacheSymptom.percentage).toBe(100);
      expect(headacheSymptom.type).toBe(SymptomValueType.BOOLEAN);
    });

    it('should handle multiple symptoms in single check-in', async () => {
      mockFind([
        {
          structured: {
            symptoms: { pain_level: 5, headache: true, mood: 'good' },
            activities: [],
            triggers: [],
            notes: '',
          },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(1);
      expect(result.symptoms).toHaveLength(3);
      expect(result.symptoms.map((s) => s.name)).toEqual(
        expect.arrayContaining(['pain_level', 'headache', 'mood'])
      );
    });

    it('should calculate frequency percentages correctly', async () => {
      // 10 check-ins, pain in 5 of them (50%)
      const checkIns = [
        ...Array(5)
          .fill(null)
          .map(() => ({
            structured: { symptoms: { pain_level: 5 }, activities: [], triggers: [], notes: '' },
          })),
        ...Array(5)
          .fill(null)
          .map(() => ({
            structured: { symptoms: {}, activities: [], triggers: [], notes: '' },
          })),
      ];

      mockFind(checkIns);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(10);
      expect(result.symptoms).toHaveLength(1);
      expect(result.symptoms[0].percentage).toBe(50);
    });

    it('should sort symptoms by frequency (most common first)', async () => {
      mockFind([
        // pain in 3 check-ins
        {
          structured: { symptoms: { pain: 5 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { pain: 5 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { pain: 5 }, activities: [], triggers: [], notes: '' },
        },
        // nausea in 5 check-ins
        {
          structured: { symptoms: { nausea: 3 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { nausea: 3 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { nausea: 3 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { nausea: 3 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { nausea: 3 }, activities: [], triggers: [], notes: '' },
        },
        // headache in 1 check-in
        {
          structured: { symptoms: { headache: true }, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.symptoms).toHaveLength(3);
      expect(result.symptoms[0].name).toBe('nausea'); // 5 occurrences
      expect(result.symptoms[1].name).toBe('pain'); // 3 occurrences
      expect(result.symptoms[2].name).toBe('headache'); // 1 occurrence
    });

    it('should round average to 2 decimal places', async () => {
      mockFind([
        {
          structured: { symptoms: { pain: 5 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { pain: 7 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { pain: 8 }, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      const painSymptom = result.symptoms[0];
      expect(painSymptom.average).toBe(6.67); // (5 + 7 + 8) / 3 = 6.666...
    });

    it('should round percentage to 1 decimal place', async () => {
      // 3 check-ins, symptom in 1 of them (33.333...%)
      mockFind([
        {
          structured: { symptoms: { pain: 5 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: {}, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: {}, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.symptoms[0].percentage).toBe(33.3);
    });
  });
});
