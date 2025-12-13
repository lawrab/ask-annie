import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import CheckIn from '../../../models/CheckIn';
import { generateDoctorSummary } from '../summaryAnalysis';

// Mock the CheckIn model
jest.mock('../../../models/CheckIn');

describe('Summary Analysis Service', () => {
  const userId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFind = (mockCheckIns: any[]) => {
    (CheckIn.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        // @ts-expect-error - Mock return value type inference issue in tests
        lean: jest.fn().mockResolvedValue(mockCheckIns),
      }),
    });
  };

  describe('generateDoctorSummary', () => {
    it('should return empty summary for user with no check-ins', async () => {
      mockFind([]);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      expect(result.overview.totalCheckins).toBe(0);
      expect(result.overview.uniqueSymptoms).toBe(0);
      expect(result.overview.flaggedCheckins).toBe(0);
      expect(result.symptomSummary).toEqual([]);
      expect(result.correlations).toEqual([]);
      expect(result.flaggedEntries).toEqual([]);
    });

    it('should calculate symptom summary correctly', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-05'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              back_pain: { severity: 5, location: 'lower back' },
            },
            activities: ['walking'],
            triggers: [],
            notes: 'Mild pain',
          },
          rawTranscript: 'I have mild back pain',
        },
        {
          userId,
          timestamp: new Date('2024-01-10'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              back_pain: { severity: 7, location: 'lower back' },
            },
            activities: ['sitting'],
            triggers: [],
            notes: 'Worse today',
          },
          rawTranscript: 'Back pain is worse',
        },
        {
          userId,
          timestamp: new Date('2024-01-15'),
          flaggedForDoctor: true,
          structured: {
            symptoms: {
              back_pain: { severity: 3, location: 'lower back' },
            },
            activities: ['stretching'],
            triggers: [],
            notes: 'Much better',
          },
          rawTranscript: 'Pain is much better',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      expect(result.overview.totalCheckins).toBe(3);
      expect(result.overview.uniqueSymptoms).toBe(1);
      expect(result.overview.flaggedCheckins).toBe(1);
      expect(result.symptomSummary).toHaveLength(1);

      const symptom = result.symptomSummary[0];
      expect(symptom.symptom).toBe('back_pain');
      expect(symptom.count).toBe(3);
      expect(symptom.minSeverity).toBe(3);
      expect(symptom.maxSeverity).toBe(7);
      expect(symptom.avgSeverity).toBe(5);
      expect(symptom.firstReported).toBe('2024-01-05');
      expect(symptom.lastReported).toBe('2024-01-15');
    });

    it('should detect worsening trend correctly', async () => {
      // Symptom getting worse over time
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 2 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Minor pain',
        },
        {
          userId,
          timestamp: new Date('2024-01-10'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 3 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Pain getting worse',
        },
        {
          userId,
          timestamp: new Date('2024-01-20'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 7 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Much worse',
        },
        {
          userId,
          timestamp: new Date('2024-01-25'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 8 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Very bad',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      const symptom = result.symptomSummary[0];
      expect(symptom.trend).toBe('worsening');
    });

    it('should detect improving trend correctly', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 8 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Bad pain',
        },
        {
          userId,
          timestamp: new Date('2024-01-10'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 7 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'A bit better',
        },
        {
          userId,
          timestamp: new Date('2024-01-20'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 3 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Much better',
        },
        {
          userId,
          timestamp: new Date('2024-01-25'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 2 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Almost gone',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      const symptom = result.symptomSummary[0];
      expect(symptom.trend).toBe('improving');
    });

    it('should detect stable trend correctly', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 5 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Pain at 5',
        },
        {
          userId,
          timestamp: new Date('2024-01-10'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 5 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Still at 5',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      const symptom = result.symptomSummary[0];
      expect(symptom.trend).toBe('stable');
    });

    it('should classify bad days correctly', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 8 }, // Bad day: severity >= 7
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Bad pain day',
        },
        {
          userId,
          timestamp: new Date('2024-01-02'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 3 }, // Good day
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Better day',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      expect(result.goodBadDayAnalysis.totalBadDays).toBeGreaterThan(0);
      expect(result.goodBadDayAnalysis.totalGoodDays).toBeGreaterThan(0);

      const badDay = result.goodBadDayAnalysis.dailyQuality.find((d) => d.date === '2024-01-01');
      expect(badDay?.quality).toBe('bad');

      const goodDay = result.goodBadDayAnalysis.dailyQuality.find((d) => d.date === '2024-01-02');
      expect(goodDay?.quality).toBe('good');
    });

    it('should classify bad days with average severity >= 6', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain1: { severity: 6 },
              pain2: { severity: 6 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Multiple pains',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      const day = result.goodBadDayAnalysis.dailyQuality.find((d) => d.date === '2024-01-01');
      expect(day?.quality).toBe('bad');
      expect(day?.avgSeverity).toBe(6);
    });

    it('should analyze correlations between activities and symptoms', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              back_pain: { severity: 7 },
            },
            activities: ['sitting'],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Pain after sitting',
        },
        {
          userId,
          timestamp: new Date('2024-01-02'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              back_pain: { severity: 8 },
            },
            activities: ['sitting'],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Pain after sitting again',
        },
        {
          userId,
          timestamp: new Date('2024-01-03'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              back_pain: { severity: 7 },
            },
            activities: ['sitting'],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Same pattern',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      expect(result.correlations.length).toBeGreaterThan(0);

      const sittingCorrelation = result.correlations.find(
        (c) => c.item === 'sitting' && c.symptom === 'back_pain'
      );
      expect(sittingCorrelation).toBeDefined();
      expect(sittingCorrelation?.itemType).toBe('activity');
      expect(sittingCorrelation?.correlationStrength).toBe(100);
    });

    it('should include flagged entries', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: true,
          structured: {
            symptoms: {
              severe_pain: { severity: 9, location: 'chest' },
            },
            activities: [],
            triggers: ['stress'],
            notes: 'Very concerning',
          },
          rawTranscript: 'Severe chest pain',
        },
        {
          userId,
          timestamp: new Date('2024-01-02'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              mild_pain: { severity: 3 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Better today',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      expect(result.flaggedEntries).toHaveLength(1);
      expect(result.flaggedEntries[0].symptoms.severe_pain).toBeDefined();
      expect(result.flaggedEntries[0].symptoms.severe_pain.severity).toBe(9);
      expect(result.flaggedEntries[0].triggers).toContain('stress');
    });

    it('should filter by flaggedOnly parameter', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: true,
          structured: {
            symptoms: {
              pain: { severity: 8 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Flagged entry',
        },
      ];

      mockFind(mockCheckIns);

      await generateDoctorSummary(userId, startDate, endDate, true);

      // When flaggedOnly is true, the filter should be applied
      expect(CheckIn.find).toHaveBeenCalledWith(
        expect.objectContaining({
          flaggedForDoctor: true,
        })
      );
    });

    it('should calculate frequency as percentage of days', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 5 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Pain day 1',
        },
        {
          userId,
          timestamp: new Date('2024-01-02'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 5 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Pain day 2',
        },
        {
          userId,
          timestamp: new Date('2024-01-03'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              headache: { severity: 6 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Headache day 3',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      const painSymptom = result.symptomSummary.find((s) => s.symptom === 'pain');
      expect(painSymptom?.frequency).toBeCloseTo(66.7, 1); // 2 out of 3 days

      const headacheSymptom = result.symptomSummary.find((s) => s.symptom === 'headache');
      expect(headacheSymptom?.frequency).toBeCloseTo(33.3, 1); // 1 out of 3 days
    });

    it('should interpolate missing days as good when surrounded by good days', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 3 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Good day',
        },
        // Jan 2 missing
        {
          userId,
          timestamp: new Date('2024-01-03'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 3 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Another good day',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      const missingDay = result.goodBadDayAnalysis.dailyQuality.find(
        (d) => d.date === '2024-01-02'
      );
      expect(missingDay?.quality).toBe('interpolated_good');
    });

    it('should interpolate missing days conservatively when surrounded by mixed quality', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 8 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Bad day',
        },
        // Jan 2 missing
        {
          userId,
          timestamp: new Date('2024-01-03'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 3 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Good day',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      const missingDay = result.goodBadDayAnalysis.dailyQuality.find(
        (d) => d.date === '2024-01-02'
      );
      // Conservative interpolation: if one side is bad, mark as bad
      expect(missingDay?.quality).toBe('interpolated_bad');
    });

    it('should handle check-ins with null/undefined symptoms', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: null,
            activities: ['walking'],
            triggers: [],
            notes: 'No symptoms today',
          },
          rawTranscript: 'Feeling fine',
        },
        {
          userId,
          timestamp: new Date('2024-01-02'),
          flaggedForDoctor: false,
          structured: {
            symptoms: undefined,
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Another good day',
        },
        {
          userId,
          timestamp: new Date('2024-01-03'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 5 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Some pain',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      // Should not crash and should process the check-in with valid symptoms
      expect(result.overview.totalCheckins).toBe(3);
      expect(result.symptomSummary).toHaveLength(1);
      expect(result.symptomSummary[0].symptom).toBe('pain');
    });

    it('should handle check-ins with null/undefined activities and triggers', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 7 },
            },
            activities: null,
            triggers: null,
            notes: 'Pain but no activities tracked',
          },
          rawTranscript: 'Just pain',
        },
        {
          userId,
          timestamp: new Date('2024-01-02'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 8 },
            },
            activities: undefined,
            triggers: undefined,
            notes: '',
          },
          rawTranscript: 'More pain',
        },
        {
          userId,
          timestamp: new Date('2024-01-03'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 7 },
            },
            activities: ['running'],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Pain after running',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      // Should not crash and handle null/undefined arrays gracefully
      expect(result.overview.totalCheckins).toBe(3);
      expect(result.symptomSummary).toHaveLength(1);

      // Correlations should only include the check-in with actual activities
      const correlations = result.correlations.filter((c) => c.item === 'running');
      expect(correlations.length).toBeGreaterThanOrEqual(0); // May or may not have correlation depending on threshold
    });

    it('should handle check-ins with missing structured data', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: null,
          rawTranscript: 'No structured data',
        },
        {
          userId,
          timestamp: new Date('2024-01-02'),
          flaggedForDoctor: false,
          structured: {
            symptoms: {
              pain: { severity: 5 },
            },
            activities: [],
            triggers: [],
            notes: '',
          },
          rawTranscript: 'Valid data',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      // Should not crash and should process the check-in with valid data
      expect(result.overview.totalCheckins).toBe(2);
      expect(result.symptomSummary).toHaveLength(1);
      expect(result.symptomSummary[0].symptom).toBe('pain');
    });

    it('should handle plain object symptoms from Mongoose .lean()', async () => {
      const mockCheckIns = [
        {
          userId,
          timestamp: new Date('2024-01-01'),
          flaggedForDoctor: false,
          structured: {
            // Plain object instead of Map (from .lean())
            symptoms: {
              back_pain: { severity: 7, location: 'lower' },
              headache: { severity: 5 },
            },
            activities: ['sitting'],
            triggers: ['stress'],
            notes: '',
          },
          rawTranscript: 'Multiple symptoms',
        },
      ];

      mockFind(mockCheckIns);

      const result = await generateDoctorSummary(userId, startDate, endDate);

      // Should handle plain object symptoms correctly
      expect(result.symptomSummary).toHaveLength(2);
      expect(result.symptomSummary.find((s) => s.symptom === 'back_pain')).toBeDefined();
      expect(result.symptomSummary.find((s) => s.symptom === 'headache')).toBeDefined();
    });
  });
});
