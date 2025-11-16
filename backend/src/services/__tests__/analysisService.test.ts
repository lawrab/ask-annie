import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import CheckIn from '../../models/CheckIn';
import {
  analyzeSymptomsForUser,
  analyzeTrendForSymptom,
  SymptomValueType,
} from '../analysisService';

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

    it('should handle symptoms with all null/undefined values', async () => {
      mockFind([
        {
          structured: {
            symptoms: { unknown_symptom: null },
            activities: [],
            triggers: [],
            notes: '',
          },
        },
        {
          structured: {
            symptoms: { unknown_symptom: undefined },
            activities: [],
            triggers: [],
            notes: '',
          },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(2);
      expect(result.symptoms).toHaveLength(1);
      expect(result.symptoms[0].name).toBe('unknown_symptom');
      expect(result.symptoms[0].type).toBe(SymptomValueType.CATEGORICAL);
    });

    it('should handle symptoms stored as Mongoose Map', async () => {
      // Simulate Mongoose Map structure
      const symptomsMap = new Map();
      symptomsMap.set('pain', 5);
      symptomsMap.set('nausea', 3);

      mockFind([
        {
          structured: { symptoms: symptomsMap, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(1);
      expect(result.symptoms).toHaveLength(2);
      expect(result.symptoms.map((s) => s.name)).toEqual(
        expect.arrayContaining(['pain', 'nausea'])
      );
    });
  });

  describe('analyzeTrendForSymptom', () => {
    it('should return null when no check-ins exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => []),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).toBeNull();
    });

    it('should return null when symptom has no numeric data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01'),
            structured: { symptoms: { mood: 'good' }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).toBeNull();
    });

    it('should calculate trend for single day with single value', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: { pain_level: 5 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.symptom).toBe('pain_level');
      expect(result!.dataPoints).toHaveLength(1);
      expect(result!.dataPoints[0].date).toBe('2024-01-01');
      expect(result!.dataPoints[0].value).toBe(5);
      expect(result!.dataPoints[0].count).toBe(1);
      expect(result!.statistics.min).toBe(5);
      expect(result!.statistics.max).toBe(5);
      expect(result!.statistics.average).toBe(5);
      expect(result!.statistics.median).toBe(5);
      expect(result!.statistics.standardDeviation).toBe(0);
    });

    it('should calculate daily average for multiple values per day', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T08:00:00Z'),
            structured: { symptoms: { pain_level: 3 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-01T14:00:00Z'),
            structured: { symptoms: { pain_level: 7 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-01T20:00:00Z'),
            structured: { symptoms: { pain_level: 5 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.dataPoints).toHaveLength(1);
      expect(result!.dataPoints[0].date).toBe('2024-01-01');
      expect(result!.dataPoints[0].value).toBe(5); // (3 + 7 + 5) / 3 = 5
      expect(result!.dataPoints[0].count).toBe(3);
    });

    it('should group data by date across multiple days', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: { pain_level: 3 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-02T10:00:00Z'),
            structured: { symptoms: { pain_level: 5 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-03T10:00:00Z'),
            structured: { symptoms: { pain_level: 7 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.dataPoints).toHaveLength(3);
      expect(result!.dataPoints[0].date).toBe('2024-01-01');
      expect(result!.dataPoints[1].date).toBe('2024-01-02');
      expect(result!.dataPoints[2].date).toBe('2024-01-03');
    });

    it('should sort data points by date', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-03T10:00:00Z'),
            structured: { symptoms: { pain_level: 7 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: { pain_level: 3 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-02T10:00:00Z'),
            structured: { symptoms: { pain_level: 5 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.dataPoints).toHaveLength(3);
      expect(result!.dataPoints[0].date).toBe('2024-01-01');
      expect(result!.dataPoints[1].date).toBe('2024-01-02');
      expect(result!.dataPoints[2].date).toBe('2024-01-03');
    });

    it('should calculate statistics correctly', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: { pain_level: 1 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-02T10:00:00Z'),
            structured: { symptoms: { pain_level: 5 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-03T10:00:00Z'),
            structured: { symptoms: { pain_level: 9 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.statistics.min).toBe(1);
      expect(result!.statistics.max).toBe(9);
      expect(result!.statistics.average).toBe(5); // (1 + 5 + 9) / 3 = 5
      expect(result!.statistics.median).toBe(5);
      expect(result!.statistics.standardDeviation).toBeGreaterThan(0);
    });

    it('should calculate median for even number of values', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: { pain_level: 2 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-02T10:00:00Z'),
            structured: { symptoms: { pain_level: 4 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-03T10:00:00Z'),
            structured: { symptoms: { pain_level: 6 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-04T10:00:00Z'),
            structured: { symptoms: { pain_level: 8 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.statistics.median).toBe(5); // (4 + 6) / 2 = 5
    });

    it('should handle symptoms stored as Mongoose Map', async () => {
      const symptomsMap = new Map();
      symptomsMap.set('pain_level', 5);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: symptomsMap, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.dataPoints).toHaveLength(1);
      expect(result!.dataPoints[0].value).toBe(5);
    });

    it('should filter out non-numeric values', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: { pain_level: 5 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-02T10:00:00Z'),
            structured: {
              symptoms: { pain_level: 'severe' },
              activities: [],
              triggers: [],
              notes: '',
            },
          },
          {
            timestamp: new Date('2024-01-03T10:00:00Z'),
            structured: { symptoms: { pain_level: 7 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.dataPoints).toHaveLength(2); // Only days with numeric values
      expect(result!.statistics.average).toBe(6); // (5 + 7) / 2
    });

    it('should round daily average to 2 decimal places', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T08:00:00Z'),
            structured: { symptoms: { pain_level: 5 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-01T16:00:00Z'),
            structured: { symptoms: { pain_level: 7 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-01T20:00:00Z'),
            structured: { symptoms: { pain_level: 8 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.dataPoints[0].value).toBe(6.67); // (5 + 7 + 8) / 3 = 6.666...
    });
  });
});
