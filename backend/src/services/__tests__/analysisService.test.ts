import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import CheckIn from '../../models/CheckIn';
import {
  analyzeSymptomsForUser,
  analyzeTrendForSymptom,
  calculateStreak,
  calculateQuickStats,
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

    it('should skip check-ins with null symptoms', async () => {
      mockFind([
        {
          structured: { symptoms: null, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { pain: 5 }, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(2);
      expect(result.symptoms).toHaveLength(1);
      expect(result.symptoms[0].name).toBe('pain');
      expect(result.symptoms[0].count).toBe(1);
    });

    it('should skip check-ins with undefined symptoms', async () => {
      mockFind([
        {
          structured: { symptoms: undefined, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { pain: 7 }, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(2);
      expect(result.symptoms).toHaveLength(1);
      expect(result.symptoms[0].name).toBe('pain');
      expect(result.symptoms[0].count).toBe(1);
    });

    it('should handle all check-ins with null symptoms', async () => {
      mockFind([
        {
          structured: { symptoms: null, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: null, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(2);
      expect(result.symptoms).toHaveLength(0);
    });

    it('should handle mix of null, undefined, and valid symptoms', async () => {
      mockFind([
        {
          structured: { symptoms: null, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: undefined, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { pain: 5 }, activities: [], triggers: [], notes: '' },
        },
        {
          structured: { symptoms: { pain: 7, nausea: 3 }, activities: [], triggers: [], notes: '' },
        },
      ]);

      const result = await analyzeSymptomsForUser(userId);

      expect(result.totalCheckins).toBe(4);
      expect(result.symptoms).toHaveLength(2);
      expect(result.symptoms[0].name).toBe('pain');
      expect(result.symptoms[0].count).toBe(2);
      expect(result.symptoms[1].name).toBe('nausea');
      expect(result.symptoms[1].count).toBe(1);
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

    it('should handle check-ins with null symptoms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: null, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-02T10:00:00Z'),
            structured: { symptoms: { pain_level: 5 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.dataPoints).toHaveLength(1);
      expect(result!.dataPoints[0].date).toBe('2024-01-02');
      expect(result!.dataPoints[0].value).toBe(5);
    });

    it('should handle check-ins with undefined symptoms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: undefined, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-02T10:00:00Z'),
            structured: { symptoms: { pain_level: 7 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.dataPoints).toHaveLength(1);
      expect(result!.dataPoints[0].date).toBe('2024-01-02');
      expect(result!.dataPoints[0].value).toBe(7);
    });

    it('should return null when all check-ins have null symptoms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: null, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-02T10:00:00Z'),
            structured: { symptoms: null, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).toBeNull();
    });

    it('should handle mix of null, undefined, and valid symptoms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn(async () => [
          {
            timestamp: new Date('2024-01-01T10:00:00Z'),
            structured: { symptoms: null, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-02T10:00:00Z'),
            structured: { symptoms: undefined, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-03T10:00:00Z'),
            structured: { symptoms: { pain_level: 3 }, activities: [], triggers: [], notes: '' },
          },
          {
            timestamp: new Date('2024-01-04T10:00:00Z'),
            structured: { symptoms: { pain_level: 7 }, activities: [], triggers: [], notes: '' },
          },
        ]),
      });

      const result = await analyzeTrendForSymptom(userId, 'pain_level', 14);

      expect(result).not.toBeNull();
      expect(result!.dataPoints).toHaveLength(2);
      expect(result!.dataPoints[0].date).toBe('2024-01-03');
      expect(result!.dataPoints[1].date).toBe('2024-01-04');
      expect(result!.statistics.average).toBe(5); // (3 + 7) / 2
    });
  });

  describe('calculateStreak', () => {
    it('should return zero stats for user with no check-ins', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn(async () => []),
      });

      const result = await calculateStreak(userId);

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.activeDays).toBe(0);
      expect(result.totalDays).toBe(0);
      expect(result.streakStartDate).toBeNull();
      expect(result.lastLogDate).toBeNull();
    });

    it('should calculate current streak with grace period (yesterday)', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);

      const twoDaysAgo = new Date(yesterday);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

      const threeDaysAgo = new Date(twoDaysAgo);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 1);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn(async () => [
          { timestamp: threeDaysAgo },
          { timestamp: twoDaysAgo },
          { timestamp: yesterday },
        ]),
      });

      const result = await calculateStreak(userId);

      expect(result.currentStreak).toBe(3);
      expect(result.activeDays).toBe(3);
      expect(result.streakStartDate).toBe(threeDaysAgo.toISOString().split('T')[0]);
    });

    it('should handle broken streaks correctly', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn(async () => [
          { timestamp: new Date('2024-01-01T12:00:00Z') },
          { timestamp: new Date('2024-01-02T12:00:00Z') },
          { timestamp: new Date('2024-01-03T12:00:00Z') },
          // Gap here (01-04 missing)
          { timestamp: new Date('2024-01-05T12:00:00Z') },
          { timestamp: new Date('2024-01-06T12:00:00Z') },
        ]),
      });

      const result = await calculateStreak(userId);

      expect(result.longestStreak).toBe(3); // The first streak of 3 consecutive days
      expect(result.activeDays).toBe(5); // Total unique days
    });

    it('should count current streak as 0 if last log was 2+ days ago', async () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      fiveDaysAgo.setHours(12, 0, 0, 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn(async () => [{ timestamp: fiveDaysAgo }]),
      });

      const result = await calculateStreak(userId);

      expect(result.currentStreak).toBe(0);
      expect(result.activeDays).toBe(1);
      expect(result.lastLogDate).toBe(fiveDaysAgo.toISOString().split('T')[0]);
    });

    it('should handle multiple logs on same day correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn(async () => [
          { timestamp: new Date(yesterday.setHours(8, 0, 0, 0)) },
          { timestamp: new Date(yesterday.setHours(14, 0, 0, 0)) },
          { timestamp: new Date(yesterday.setHours(20, 0, 0, 0)) },
        ]),
      });

      const result = await calculateStreak(userId);

      expect(result.activeDays).toBe(1); // Should only count as 1 unique day
      expect(result.currentStreak).toBe(1);
    });

    it('should calculate total days from first to last check-in', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn(async () => [
          { timestamp: new Date('2024-01-01T12:00:00Z') },
          { timestamp: new Date('2024-01-10T12:00:00Z') },
        ]),
      });

      const result = await calculateStreak(userId);

      expect(result.totalDays).toBe(10); // 10 days from Jan 1 to Jan 10 inclusive
      expect(result.activeDays).toBe(2); // Only logged on 2 days
    });

    it('should calculate longest streak across entire history', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn(async () => [
          { timestamp: new Date('2024-01-01T12:00:00Z') },
          { timestamp: new Date('2024-01-02T12:00:00Z') },
          // Gap
          { timestamp: new Date('2024-01-05T12:00:00Z') },
          { timestamp: new Date('2024-01-06T12:00:00Z') },
          { timestamp: new Date('2024-01-07T12:00:00Z') },
          { timestamp: new Date('2024-01-08T12:00:00Z') },
          { timestamp: new Date('2024-01-09T12:00:00Z') },
        ]),
      });

      const result = await calculateStreak(userId);

      expect(result.longestStreak).toBe(5); // Days 5-9 is the longest streak
    });

    it('should handle single check-in correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn(async () => [{ timestamp: yesterday }]),
      });

      const result = await calculateStreak(userId);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.activeDays).toBe(1);
      expect(result.totalDays).toBe(1);
    });

    it('should return last log date correctly', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn(async () => [
          { timestamp: new Date('2024-01-01T12:00:00Z') },
          { timestamp: new Date('2024-01-05T12:00:00Z') },
          { timestamp: new Date('2024-01-10T12:00:00Z') },
        ]),
      });

      const result = await calculateStreak(userId);

      expect(result.lastLogDate).toBe('2024-01-10');
    });
  });

  describe('calculateQuickStats', () => {
    it('should return empty stats for user with no check-ins', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockResolvedValue([]);

      const result = await calculateQuickStats(userId, 7);

      expect(result.checkInCount.current).toBe(0);
      expect(result.checkInCount.previous).toBe(0);
      expect(result.checkInCount.change).toBe(0);
      expect(result.checkInCount.percentChange).toBe(0);
      expect(result.topSymptoms).toEqual([]);
      expect(result.averageSeverity.current).toBe(0);
      expect(result.averageSeverity.previous).toBe(0);
      expect(result.period.current.days).toBe(7);
      expect(result.period.previous.days).toBe(7);
    });

    it('should calculate check-in count and percentage change correctly', async () => {
      let callCount = 0;
      const currentPeriodCheckIns = [
        { structured: { symptoms: { headache: { severity: 5 } } } },
        { structured: { symptoms: { headache: { severity: 6 } } } },
        { structured: { symptoms: { headache: { severity: 7 } } } },
      ];
      const previousPeriodCheckIns = [
        { structured: { symptoms: { headache: { severity: 5 } } } },
        { structured: { symptoms: { headache: { severity: 6 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        // First call is for current period, second for previous
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentPeriodCheckIns);
        } else {
          return Promise.resolve(previousPeriodCheckIns);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.checkInCount.current).toBe(3);
      expect(result.checkInCount.previous).toBe(2);
      expect(result.checkInCount.change).toBe(1);
      expect(result.checkInCount.percentChange).toBe(50.0);
    });

    it('should calculate top symptoms by frequency', async () => {
      let callCount = 0;
      const currentPeriodCheckIns = [
        { structured: { symptoms: { headache: { severity: 8 }, fatigue: { severity: 5 } } } },
        { structured: { symptoms: { headache: { severity: 7 }, nausea: { severity: 3 } } } },
        { structured: { symptoms: { headache: { severity: 9 }, fatigue: { severity: 6 }, nausea: { severity: 4 } } } },
        { structured: { symptoms: { fatigue: { severity: 7 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentPeriodCheckIns);
        } else {
          return Promise.resolve([]);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.topSymptoms).toHaveLength(3);
      expect(result.topSymptoms[0].name).toBe('headache');
      expect(result.topSymptoms[0].frequency).toBe(3);
      expect(result.topSymptoms[1].name).toBe('fatigue');
      expect(result.topSymptoms[1].frequency).toBe(3);
      expect(result.topSymptoms[2].name).toBe('nausea');
      expect(result.topSymptoms[2].frequency).toBe(2);
    });

    it('should calculate average severity for symptoms', async () => {
      let callCount = 0;
      const currentPeriodCheckIns = [
        { structured: { symptoms: { headache: { severity: 5 } } } },
        { structured: { symptoms: { headache: { severity: 7 } } } },
        { structured: { symptoms: { headache: { severity: 9 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentPeriodCheckIns);
        } else {
          return Promise.resolve([]);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.topSymptoms[0].avgSeverity).toBe(7); // (5 + 7 + 9) / 3 = 7
      expect(result.averageSeverity.current).toBe(7);
    });

    it('should determine "improving" trend when severity decreases >10%', async () => {
      let callCount = 0;
      const currentCheckIns = [
        { structured: { symptoms: { headache: { severity: 4 } } } },
        { structured: { symptoms: { headache: { severity: 5 } } } },
      ];

      const previousCheckIns = [
        { structured: { symptoms: { headache: { severity: 8 } } } },
        { structured: { symptoms: { headache: { severity: 10 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve(previousCheckIns);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.topSymptoms[0].trend).toBe('improving');
      expect(result.averageSeverity.trend).toBe('improving');
    });

    it('should determine "worsening" trend when severity increases >10%', async () => {
      let callCount = 0;
      const currentCheckIns = [
        { structured: { symptoms: { headache: { severity: 9 } } } },
        { structured: { symptoms: { headache: { severity: 10 } } } },
      ];

      const previousCheckIns = [
        { structured: { symptoms: { headache: { severity: 5 } } } },
        { structured: { symptoms: { headache: { severity: 4 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve(previousCheckIns);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.topSymptoms[0].trend).toBe('worsening');
      expect(result.averageSeverity.trend).toBe('worsening');
    });

    it('should determine "stable" trend when change is within ±10%', async () => {
      let callCount = 0;
      const currentCheckIns = [
        { structured: { symptoms: { headache: { severity: 5 } } } },
        { structured: { symptoms: { headache: { severity: 6 } } } },
      ];

      const previousCheckIns = [
        { structured: { symptoms: { headache: { severity: 5 } } } },
        { structured: { symptoms: { headache: { severity: 5 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve(previousCheckIns);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.topSymptoms[0].trend).toBe('stable');
    });

    it('should return max 5 top symptoms', async () => {
      let callCount = 0;
      const currentCheckIns = [
        { structured: { symptoms: { s1: { severity: 5 }, s2: { severity: 5 }, s3: { severity: 5 }, s4: { severity: 5 }, s5: { severity: 5 }, s6: { severity: 5 }, s7: { severity: 5 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve([]);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.topSymptoms).toHaveLength(5);
    });

    it('should handle custom days parameter', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockResolvedValue([]);

      const result = await calculateQuickStats(userId, 14);

      expect(result.period.current.days).toBe(14);
      expect(result.period.previous.days).toBe(14);
    });

    it('should handle symptoms stored as Map objects', async () => {
      let callCount = 0;
      const symptomsMap = new Map<string, { severity: number }>();
      symptomsMap.set('headache', { severity: 7 });
      symptomsMap.set('fatigue', { severity: 5 });

      const currentCheckIns = [{ structured: { symptoms: symptomsMap } }];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve([]);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.topSymptoms.length).toBeGreaterThan(0);
      expect(result.topSymptoms.some((s) => s.name === 'headache')).toBe(true);
    });

    it('should handle 0% change when previous count is 0', async () => {
      let callCount = 0;
      const currentCheckIns = [
        { structured: { symptoms: { headache: { severity: 5 } } } },
        { structured: { symptoms: { headache: { severity: 6 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve([]);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.checkInCount.percentChange).toBe(0);
    });

    it('should handle null symptoms in current period', async () => {
      let callCount = 0;
      const currentCheckIns = [
        { structured: { symptoms: null } },
        { structured: { symptoms: { headache: { severity: 5 } } } },
        { structured: { symptoms: { headache: { severity: 7 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve([]);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.checkInCount.current).toBe(3);
      expect(result.topSymptoms).toHaveLength(1);
      expect(result.topSymptoms[0].name).toBe('headache');
      expect(result.topSymptoms[0].frequency).toBe(2);
      expect(result.topSymptoms[0].avgSeverity).toBe(6); // (5 + 7) / 2
    });

    it('should handle undefined symptoms in current period', async () => {
      let callCount = 0;
      const currentCheckIns = [
        { structured: { symptoms: undefined } },
        { structured: { symptoms: { fatigue: { severity: 8 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve([]);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.checkInCount.current).toBe(2);
      expect(result.topSymptoms).toHaveLength(1);
      expect(result.topSymptoms[0].name).toBe('fatigue');
      expect(result.topSymptoms[0].frequency).toBe(1);
    });

    it('should handle null symptoms in previous period', async () => {
      let callCount = 0;
      const currentCheckIns = [{ structured: { symptoms: { headache: { severity: 6 } } } }];
      const previousCheckIns = [
        { structured: { symptoms: null } },
        { structured: { symptoms: { headache: { severity: 9 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve(previousCheckIns);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.topSymptoms[0].trend).toBe('improving'); // 6 < 9, severity decreased >10%
      expect(result.averageSeverity.current).toBe(6);
      expect(result.averageSeverity.previous).toBe(9);
    });

    it('should handle undefined symptoms in previous period', async () => {
      let callCount = 0;
      const currentCheckIns = [{ structured: { symptoms: { headache: { severity: 8 } } } }];
      const previousCheckIns = [
        { structured: { symptoms: undefined } },
        { structured: { symptoms: { headache: { severity: 5 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve(previousCheckIns);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.topSymptoms[0].trend).toBe('worsening'); // 8 > 5, severity increased >10%
      expect(result.averageSeverity.current).toBe(8);
      expect(result.averageSeverity.previous).toBe(5);
    });

    it('should handle mix of null and valid symptoms in both periods', async () => {
      let callCount = 0;
      const currentCheckIns = [
        { structured: { symptoms: null } },
        { structured: { symptoms: { headache: { severity: 5 }, fatigue: { severity: 6 } } } },
        { structured: { symptoms: undefined } },
        { structured: { symptoms: { headache: { severity: 7 } } } },
      ];
      const previousCheckIns = [
        { structured: { symptoms: { headache: { severity: 10 } } } },
        { structured: { symptoms: null } },
        { structured: { symptoms: { fatigue: { severity: 8 } } } },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve(previousCheckIns);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.checkInCount.current).toBe(4);
      expect(result.checkInCount.previous).toBe(3);
      expect(result.topSymptoms).toHaveLength(2);
      expect(result.topSymptoms[0].name).toBe('headache');
      expect(result.topSymptoms[0].frequency).toBe(2);
      expect(result.topSymptoms[0].avgSeverity).toBe(6); // (5 + 7) / 2
      expect(result.topSymptoms[1].name).toBe('fatigue');
      expect(result.topSymptoms[1].frequency).toBe(1);
    });

    it('should handle all check-ins with null symptoms in current period', async () => {
      let callCount = 0;
      const currentCheckIns = [
        { structured: { symptoms: null } },
        { structured: { symptoms: undefined } },
      ];
      const previousCheckIns = [{ structured: { symptoms: { headache: { severity: 5 } } } }];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve(previousCheckIns);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.checkInCount.current).toBe(2);
      expect(result.topSymptoms).toHaveLength(0);
      expect(result.averageSeverity.current).toBe(0);
      expect(result.averageSeverity.previous).toBe(5);
    });

    it('should handle all check-ins with null symptoms in both periods', async () => {
      let callCount = 0;
      const currentCheckIns = [{ structured: { symptoms: null } }];
      const previousCheckIns = [{ structured: { symptoms: undefined } }];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.find as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(currentCheckIns);
        } else {
          return Promise.resolve(previousCheckIns);
        }
      });

      const result = await calculateQuickStats(userId, 7);

      expect(result.checkInCount.current).toBe(1);
      expect(result.checkInCount.previous).toBe(1);
      expect(result.topSymptoms).toHaveLength(0);
      expect(result.averageSeverity.current).toBe(0);
      expect(result.averageSeverity.previous).toBe(0);
      expect(result.averageSeverity.trend).toBe('stable');
    });
  });
});
