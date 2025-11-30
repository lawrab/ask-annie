import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import CheckIn from '../../models/CheckIn';
import { getCheckInContext } from '../checkinContextService';
import * as streakAnalysis from '../analysis/streakAnalysis';

// Mock dependencies
jest.mock('../../models/CheckIn');
jest.mock('../analysis/streakAnalysis');

describe('checkinContextService', () => {
  const userId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create mock check-in
  const createMockCheckIn = (
    symptoms: Record<string, { severity: number }>,
    timestamp: Date = new Date()
  ) => ({
    _id: new mongoose.Types.ObjectId(),
    userId: userId.toString(),
    timestamp,
    structured: {
      symptoms,
      activities: [],
      triggers: [],
      notes: '',
    },
    flaggedForDoctor: false,
  });

  // Helper to mock CheckIn.findOne with sort
  const mockFindOne = (data: ReturnType<typeof createMockCheckIn> | null) => {
    const chain = {
      sort: jest.fn<() => Promise<any>>().mockResolvedValue(data),
    };
    (CheckIn.findOne as any).mockReturnValue(chain);
  };

  // Helper to mock CheckIn.find for symptom aggregation
  const mockFind = (currentCheckIns: any[], previousCheckIns: any[]) => {
    let callCount = 0;
    (CheckIn.find as any).mockImplementation(() => {
      const data = callCount === 0 ? currentCheckIns : previousCheckIns;
      callCount++;
      return Promise.resolve(data);
    });
  };

  // Helper to mock streak analysis
  const mockStreak = (data: {
    currentStreak: number;
    longestStreak: number;
    activeDays: number;
    totalDays: number;
    streakStartDate: string | null;
    lastLogDate: string | null;
  }) => {
    (streakAnalysis.calculateStreak as any).mockResolvedValue(data);
  };

  describe('getCheckInContext', () => {
    it('should return context with last check-in and recent symptoms', async () => {
      const lastCheckIn = createMockCheckIn(
        { headache: { severity: 7 }, fatigue: { severity: 5 } },
        new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      );

      mockFindOne(lastCheckIn);

      // Mock find for current and previous period check-ins
      mockFind(
        [
          createMockCheckIn({ headache: { severity: 7 }, fatigue: { severity: 5 } }),
          createMockCheckIn({ headache: { severity: 6 } }),
        ],
        [createMockCheckIn({ headache: { severity: 8 } })]
      );

      // Mock streak calculation
      mockStreak({
        currentStreak: 5,
        longestStreak: 10,
        activeDays: 30,
        totalDays: 60,
        streakStartDate: new Date().toISOString(),
        lastLogDate: new Date().toISOString(),
      });

      const context = await getCheckInContext(userId.toString());

      expect(context).toHaveProperty('lastCheckIn');
      expect(context.lastCheckIn?.symptoms).toHaveLength(2);
      expect(context.lastCheckIn?.symptoms[0].name).toBe('headache');
      expect(context.lastCheckIn?.symptoms[0].severity).toBe(7);
      expect(context.lastCheckIn?.timeAgo).toContain('hour');
      expect(context.streak.current).toBe(5);
      expect(context.streak.message).toContain('5-day streak');
    });

    it('should return context without lastCheckIn for new users', async () => {
      mockFindOne(null);
      mockFind([], []);

      mockStreak({
        currentStreak: 0,
        longestStreak: 0,
        activeDays: 0,
        totalDays: 0,
        streakStartDate: null,
        lastLogDate: null,
      });

      const context = await getCheckInContext(userId.toString());

      expect(context.lastCheckIn).toBeUndefined();
      expect(context.recentSymptoms).toHaveLength(0);
      expect(context.streak.current).toBe(0);
      expect(context.streak.message).toBeUndefined();
      expect(context.suggestedTopics).toContain('Rate symptoms 1-10');
    });

    it('should calculate improving trend when severity decreases', async () => {
      mockFindOne(null);

      // Current period: lower severity
      const currentCheckIns = [
        createMockCheckIn({ headache: { severity: 4 } }),
        createMockCheckIn({ headache: { severity: 5 } }),
      ];
      // Previous period: higher severity
      const previousCheckIns = [
        createMockCheckIn({ headache: { severity: 8 } }),
        createMockCheckIn({ headache: { severity: 7 } }),
      ];

      mockFind(currentCheckIns, previousCheckIns);

      mockStreak({
        currentStreak: 2,
        longestStreak: 5,
        activeDays: 10,
        totalDays: 20,
        streakStartDate: new Date().toISOString(),
        lastLogDate: new Date().toISOString(),
      });

      const context = await getCheckInContext(userId.toString());

      // headache avg current: 4.5, previous: 7.5
      // Change: (4.5 - 7.5) / 7.5 * 100 = -40%, should be improving
      const headacheSymptom = context.recentSymptoms.find((s) => s.name === 'headache');
      expect(headacheSymptom?.trend).toBe('improving');
    });

    it('should calculate worsening trend when severity increases', async () => {
      mockFindOne(null);

      // Current period: higher severity
      const currentCheckIns = [
        createMockCheckIn({ backpain: { severity: 8 } }),
        createMockCheckIn({ backpain: { severity: 9 } }),
      ];
      // Previous period: lower severity
      const previousCheckIns = [
        createMockCheckIn({ backpain: { severity: 4 } }),
        createMockCheckIn({ backpain: { severity: 5 } }),
      ];

      mockFind(currentCheckIns, previousCheckIns);

      mockStreak({
        currentStreak: 2,
        longestStreak: 5,
        activeDays: 10,
        totalDays: 20,
        streakStartDate: new Date().toISOString(),
        lastLogDate: new Date().toISOString(),
      });

      const context = await getCheckInContext(userId.toString());

      // backpain avg current: 8.5, previous: 4.5
      // Change: (8.5 - 4.5) / 4.5 * 100 = 88%, should be worsening
      const backpainSymptom = context.recentSymptoms.find((s) => s.name === 'backpain');
      expect(backpainSymptom?.trend).toBe('worsening');
    });

    it('should show stable trend when severity changes less than 10%', async () => {
      mockFindOne(null);

      // Current period
      const currentCheckIns = [createMockCheckIn({ nausea: { severity: 5 } })];
      // Previous period: similar severity
      const previousCheckIns = [createMockCheckIn({ nausea: { severity: 5 } })];

      mockFind(currentCheckIns, previousCheckIns);

      mockStreak({
        currentStreak: 2,
        longestStreak: 5,
        activeDays: 10,
        totalDays: 20,
        streakStartDate: new Date().toISOString(),
        lastLogDate: new Date().toISOString(),
      });

      const context = await getCheckInContext(userId.toString());

      const nauseaSymptom = context.recentSymptoms.find((s) => s.name === 'nausea');
      expect(nauseaSymptom?.trend).toBe('stable');
    });

    it('should not show streak message for streaks less than 3 days', async () => {
      mockFindOne(null);
      mockFind([], []);

      mockStreak({
        currentStreak: 2,
        longestStreak: 2,
        activeDays: 2,
        totalDays: 2,
        streakStartDate: new Date().toISOString(),
        lastLogDate: new Date().toISOString(),
      });

      const context = await getCheckInContext(userId.toString());

      expect(context.streak.current).toBe(2);
      expect(context.streak.message).toBeUndefined();
    });

    it('should limit recent symptoms to 5', async () => {
      mockFindOne(null);

      const currentCheckIns = [
        createMockCheckIn({
          symptom1: { severity: 5 },
          symptom2: { severity: 5 },
          symptom3: { severity: 5 },
          symptom4: { severity: 5 },
          symptom5: { severity: 5 },
          symptom6: { severity: 5 },
          symptom7: { severity: 5 },
        }),
      ];

      mockFind(currentCheckIns, []);

      mockStreak({
        currentStreak: 1,
        longestStreak: 1,
        activeDays: 1,
        totalDays: 1,
        streakStartDate: new Date().toISOString(),
        lastLogDate: new Date().toISOString(),
      });

      const context = await getCheckInContext(userId.toString());

      expect(context.recentSymptoms.length).toBeLessThanOrEqual(5);
    });

    it('should sort last check-in symptoms by severity descending', async () => {
      const lastCheckIn = createMockCheckIn({
        mild: { severity: 2 },
        severe: { severity: 9 },
        moderate: { severity: 5 },
      });

      mockFindOne(lastCheckIn);
      mockFind([], []);

      mockStreak({
        currentStreak: 1,
        longestStreak: 1,
        activeDays: 1,
        totalDays: 1,
        streakStartDate: new Date().toISOString(),
        lastLogDate: new Date().toISOString(),
      });

      const context = await getCheckInContext(userId.toString());

      expect(context.lastCheckIn?.symptoms[0].name).toBe('severe');
      expect(context.lastCheckIn?.symptoms[1].name).toBe('moderate');
      expect(context.lastCheckIn?.symptoms[2].name).toBe('mild');
    });
  });
});
