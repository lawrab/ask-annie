import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import CheckIn from '../../models/CheckIn';
import {
  calculateSymptomAverage,
  getCheckInMilestones,
  generateDataContextCard,
  generateValidationCard,
  generatePostCheckInInsight,
} from '../insightService';

// Mock the CheckIn model
jest.mock('../../models/CheckIn');

describe('insightService', () => {
  const userId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
  const checkInId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to mock CheckIn.find with chained methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockFindChain = (data: any[], methods: string[] = ['select', 'lean']) => {
    const chain: Record<string, jest.Mock> = {};

    methods.forEach((method, index) => {
      if (index === methods.length - 1) {
        // Last method in chain returns the data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chain[method] = jest.fn(async () => data as any);
      } else {
        // Intermediate methods return the chain
        chain[method] = jest.fn().mockReturnThis();
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CheckIn.find as any).mockReturnValue(chain);
  };

  describe('calculateSymptomAverage', () => {
    it('should calculate average severity for a symptom', async () => {
      const mockCheckIns = [
        {
          structured: {
            symptoms: { headache: { severity: 5 } },
          },
        },
        {
          structured: {
            symptoms: { headache: { severity: 7 } },
          },
        },
        {
          structured: {
            symptoms: { headache: { severity: 9 } },
          },
        },
      ];

      mockFindChain(mockCheckIns);

      const average = await calculateSymptomAverage(userId.toString(), 'headache', 7);

      expect(average).toBe(7); // (5 + 7 + 9) / 3 = 7
    });

    it('should return null if symptom not found', async () => {
      const mockCheckIns = [
        {
          structured: {
            symptoms: { headache: { severity: 5 } },
          },
        },
      ];

      mockFindChain(mockCheckIns);

      const average = await calculateSymptomAverage(userId.toString(), 'backpain', 7);

      expect(average).toBeNull();
    });

    it('should return null if no check-ins in time period', async () => {
      mockFindChain([]);

      const average = await calculateSymptomAverage(userId.toString(), 'headache', 7);

      expect(average).toBeNull();
    });

    it('should handle Map-based symptoms', async () => {
      const symptomsMap = new Map([['headache', { severity: 6 }]]);

      const mockCheckIns = [
        {
          structured: {
            symptoms: symptomsMap,
          },
        },
      ];

      mockFindChain(mockCheckIns);

      const average = await calculateSymptomAverage(userId.toString(), 'headache', 7);

      expect(average).toBe(6);
    });
  });

  describe('getCheckInMilestones', () => {
    it('should return correct check-in count', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(3);

      const mockCheckIns = [
        { timestamp: new Date('2024-01-01') },
        { timestamp: new Date('2024-01-02') },
        { timestamp: new Date('2024-01-03') },
      ];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      const milestones = await getCheckInMilestones(userId.toString());

      expect(milestones.totalCheckIns).toBe(3);
    });

    it('should detect milestone at specific counts', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(10);

      const mockCheckIns = [{ timestamp: new Date() }];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      const milestones = await getCheckInMilestones(userId.toString());

      expect(milestones.isMilestone).toBe(true);
      expect(milestones.milestoneNumber).toBe(10);
    });

    it('should not detect milestone at non-milestone counts', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(2);

      const mockCheckIns = [{ timestamp: new Date() }, { timestamp: new Date() }];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      const milestones = await getCheckInMilestones(userId.toString());

      expect(milestones.isMilestone).toBe(false);
      expect(milestones.milestoneNumber).toBeUndefined();
    });

    it('should calculate current streak correctly', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(3);

      const mockCheckIns = [
        { timestamp: today },
        { timestamp: yesterday },
        { timestamp: twoDaysAgo },
      ];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      const milestones = await getCheckInMilestones(userId.toString());

      expect(milestones.currentStreak).toBeGreaterThanOrEqual(2);
    });

    it('should return zero streak for no check-ins', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(0);

      mockFindChain([], ['select', 'sort', 'lean']);

      const milestones = await getCheckInMilestones(userId.toString());

      expect(milestones.totalCheckIns).toBe(0);
      expect(milestones.currentStreak).toBe(0);
      expect(milestones.isMilestone).toBe(false);
    });
  });

  describe('generateDataContextCard', () => {
    it('should generate card when symptom is significantly below average', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: { headache: { severity: 4 } },
        },
      };

      // Mock historical check-ins with high severity
      const mockCheckIns = [
        { structured: { symptoms: { headache: { severity: 8 } } } },
        { structured: { symptoms: { headache: { severity: 9 } } } },
        { structured: { symptoms: { headache: { severity: 10 } } } },
      ];

      mockFindChain(mockCheckIns);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(3);

      const card = await generateDataContextCard(userId.toString(), mockCurrentCheckIn);

      expect(card).not.toBeNull();
      expect(card?.type).toBe('data_context');
      expect(card?.title).toBe("Today's Context");
      expect(card?.message).toContain('below');
      expect(card?.message).toContain('trending better');
    });

    it('should generate card when symptom is significantly above average', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: { headache: { severity: 8 } },
        },
      };

      // Mock historical check-ins with low severity
      const mockCheckIns = [
        { structured: { symptoms: { headache: { severity: 3 } } } },
        { structured: { symptoms: { headache: { severity: 2 } } } },
      ];

      mockFindChain(mockCheckIns);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(2);

      const card = await generateDataContextCard(userId.toString(), mockCurrentCheckIn);

      expect(card).not.toBeNull();
      expect(card?.type).toBe('data_context');
      expect(card?.message).toContain('above');
      expect(card?.message).toContain('higher than usual');
    });

    it('should generate streak card as fallback', async () => {
      const today = new Date();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: { headache: { severity: 5 } },
        },
      };

      // Mock similar severities (no significant difference)
      const mockCheckIns = [
        {
          structured: { symptoms: { headache: { severity: 5 } } },
          timestamp: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          structured: { symptoms: { headache: { severity: 5 } } },
          timestamp: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          structured: { symptoms: { headache: { severity: 5 } } },
          timestamp: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
        { structured: { symptoms: { headache: { severity: 5 } } }, timestamp: today },
      ];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(4);

      const card = await generateDataContextCard(userId.toString(), mockCurrentCheckIn);

      // Should get streak card since no significant difference
      expect(card).not.toBeNull();
      expect(card?.type).toBe('data_context');
    });

    it('should return null if no significant context', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: { headache: { severity: 5 } },
        },
      };

      // No historical data
      mockFindChain([], ['select', 'sort', 'lean']);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(1);

      const card = await generateDataContextCard(userId.toString(), mockCurrentCheckIn);

      expect(card).toBeNull();
    });

    it('should return null if no symptoms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: {},
        },
      };

      const card = await generateDataContextCard(userId.toString(), mockCurrentCheckIn);

      expect(card).toBeNull();
    });

    it('should handle Map-based symptoms correctly', async () => {
      const symptomsMap = new Map([['headache', { severity: 4 }]]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: symptomsMap,
        },
      };

      // Mock historical check-ins with high severity
      const mockCheckIns = [
        { structured: { symptoms: { headache: { severity: 8 } } } },
        { structured: { symptoms: { headache: { severity: 9 } } } },
        { structured: { symptoms: { headache: { severity: 10 } } } },
      ];

      mockFindChain(mockCheckIns);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(3);

      const card = await generateDataContextCard(userId.toString(), mockCurrentCheckIn);

      expect(card).not.toBeNull();
      expect(card?.type).toBe('data_context');
      expect(card?.title).toBe("Today's Context");
      expect(card?.message).toContain('below');
      expect(card?.message).toContain('trending better');
    });
  });

  describe('generateValidationCard', () => {
    it('should generate milestone card at milestone count', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: { headache: { severity: 5 } },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(10);

      const mockCheckIns = [{ timestamp: new Date() }];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      const card = await generateValidationCard(userId.toString(), mockCurrentCheckIn);

      expect(card.type).toBe('validation');
      expect(card.title).toBe('Milestone Reached');
      expect(card.message).toContain('10th check-in');
    });

    it('should generate high severity validation for severe symptoms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: { headache: { severity: 8 } },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(3);

      const mockCheckIns = [{ timestamp: new Date() }];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      const card = await generateValidationCard(userId.toString(), mockCurrentCheckIn);

      expect(card.type).toBe('validation');
      expect(card.title).toBe('You Showed Up');
      expect(card.message).toContain('8/10');
      expect(card.message).toContain('strength');
    });

    it('should generate default validation for normal symptoms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: { headache: { severity: 4 } },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(1);

      const mockCheckIns = [{ timestamp: new Date() }];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      const card = await generateValidationCard(userId.toString(), mockCurrentCheckIn);

      expect(card.type).toBe('validation');
      expect(card.icon).toBe('💚');
      expect(card.message).toBeTruthy();
    });

    it('should handle no symptoms gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: {},
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(1);

      const mockCheckIns = [{ timestamp: new Date() }];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      const card = await generateValidationCard(userId.toString(), mockCurrentCheckIn);

      expect(card.type).toBe('validation');
      expect(card.icon).toBe('💚');
    });

    it('should handle Map-based symptoms correctly', async () => {
      const symptomsMap = new Map([
        ['headache', { severity: 8 }],
        ['fatigue', { severity: 6 }],
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: symptomsMap,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(3);

      const mockCheckIns = [{ timestamp: new Date() }];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      const card = await generateValidationCard(userId.toString(), mockCurrentCheckIn);

      expect(card.type).toBe('validation');
      expect(card.title).toBe('You Showed Up');
      expect(card.message).toContain('8/10');
      expect(card.message).toContain('strength');
    });
  });

  describe('generatePostCheckInInsight', () => {
    it('should return data context card when available', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: { headache: { severity: 4 } },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.findById as any).mockResolvedValue(mockCurrentCheckIn);

      // Mock historical high severity
      const mockCheckIns = [
        { structured: { symptoms: { headache: { severity: 8 } } } },
        { structured: { symptoms: { headache: { severity: 9 } } } },
      ];

      mockFindChain(mockCheckIns, ['select', 'sort', 'lean']);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(3);

      const insight = await generatePostCheckInInsight(userId.toString(), checkInId.toString());

      expect(insight.type).toBe('data_context');
      expect(insight.message).toContain('below');
    });

    it('should fallback to validation card when no data context', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: { headache: { severity: 5 } },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.findById as any).mockResolvedValue(mockCurrentCheckIn);

      // No historical data
      mockFindChain([], ['select', 'sort', 'lean']);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(1);

      const insight = await generatePostCheckInInsight(userId.toString(), checkInId.toString());

      expect(insight.type).toBe('validation');
      expect(insight.icon).toBe('💚');
    });

    it('should throw error if check-in not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.findById as any).mockResolvedValue(null);

      await expect(
        generatePostCheckInInsight(userId.toString(), checkInId.toString())
      ).rejects.toThrow('Check-in not found');
    });

    it('should always return an insight', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCurrentCheckIn: any = {
        _id: checkInId,
        userId,
        structured: {
          symptoms: {},
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.findById as any).mockResolvedValue(mockCurrentCheckIn);

      mockFindChain([], ['select', 'sort', 'lean']);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (CheckIn.countDocuments as any).mockResolvedValue(1);

      const insight = await generatePostCheckInInsight(userId.toString(), checkInId.toString());

      expect(insight).toBeTruthy();
      expect(insight.type).toBeTruthy();
      expect(insight.title).toBeTruthy();
      expect(insight.message).toBeTruthy();
      expect(insight.icon).toBeTruthy();
    });
  });
});
