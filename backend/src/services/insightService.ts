import CheckIn, { ICheckIn } from '../models/CheckIn';
import { InsightCard } from '../types';

/**
 * Milestone check-in counts that trigger special validation messages
 */
const MILESTONE_COUNTS = [5, 10, 20, 30, 50, 100];

/**
 * Minimum percentage difference to consider a symptom significantly different from average
 */
const SIGNIFICANT_DIFFERENCE_THRESHOLD = 0.2; // 20%

/**
 * Interface for check-in milestone data
 */
interface CheckInMilestones {
  totalCheckIns: number;
  currentStreak: number;
  isMilestone: boolean;
  milestoneNumber?: number;
}

/**
 * Calculate average severity for a specific symptom over a time period
 */
export async function calculateSymptomAverage(
  userId: string,
  symptomName: string,
  days: number
): Promise<number | null> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const checkIns = await CheckIn.find({
    userId,
    timestamp: { $gte: startDate },
  })
    .select('structured.symptoms')
    .lean();

  const severities: number[] = [];

  checkIns.forEach((checkIn) => {
    const symptoms = checkIn.structured?.symptoms;
    if (!symptoms) return;

    // Handle both Map and plain object
    const symptomValue =
      symptoms instanceof Map ? symptoms.get(symptomName) : symptoms[symptomName];

    if (symptomValue && typeof symptomValue === 'object' && 'severity' in symptomValue) {
      const severity = Number(symptomValue.severity);
      if (!isNaN(severity)) {
        severities.push(severity);
      }
    }
  });

  if (severities.length === 0) return null;

  const sum = severities.reduce((acc, val) => acc + val, 0);
  return sum / severities.length;
}

/**
 * Get user's check-in milestones (total count, streak, milestone status)
 */
export async function getCheckInMilestones(userId: string): Promise<CheckInMilestones> {
  const totalCheckIns = await CheckIn.countDocuments({ userId });

  // Calculate current streak
  const checkIns = await CheckIn.find({ userId })
    .select('timestamp')
    .sort({ timestamp: -1 })
    .lean();

  let currentStreak = 0;
  if (checkIns.length > 0) {
    const uniqueDates = new Set<string>();
    checkIns.forEach((checkIn) => {
      const date = checkIn.timestamp.toISOString().split('T')[0];
      uniqueDates.add(date);
    });

    const sortedDates = Array.from(uniqueDates).sort().reverse();

    // Start from yesterday (grace period)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const currentDate = new Date(yesterdayStr);

    for (const dateStr of sortedDates) {
      const checkInDate = new Date(dateStr);
      const expectedDateStr = currentDate.toISOString().split('T')[0];

      if (dateStr === expectedDateStr) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (checkInDate < currentDate) {
        break;
      }
    }
  }

  // Check if this is a milestone
  const isMilestone = MILESTONE_COUNTS.includes(totalCheckIns);
  const milestoneNumber = isMilestone ? totalCheckIns : undefined;

  return {
    totalCheckIns,
    currentStreak,
    isMilestone,
    milestoneNumber,
  };
}

/**
 * Generate a data context card comparing current check-in to historical data
 */
export async function generateDataContextCard(
  userId: string,
  checkIn: ICheckIn
): Promise<InsightCard | null> {
  const symptoms = checkIn.structured?.symptoms;
  if (!symptoms) return null;

  // Get all symptoms from current check-in
  const symptomEntries: Array<[string, { severity: number }]> = [];

  if (symptoms instanceof Map) {
    symptoms.forEach((value, key) => {
      if (value && typeof value === 'object' && 'severity' in value) {
        symptomEntries.push([key, value]);
      }
    });
  } else {
    Object.entries(symptoms).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'severity' in value) {
        symptomEntries.push([key, value]);
      }
    });
  }

  if (symptomEntries.length === 0) return null;

  // Try to find a significant comparison for any symptom
  for (const [symptomName, symptomValue] of symptomEntries) {
    const currentSeverity = Number(symptomValue.severity);
    if (isNaN(currentSeverity)) continue;

    // Compare to 14-day average
    const average = await calculateSymptomAverage(userId, symptomName, 14);

    if (average !== null) {
      const difference = Math.abs(currentSeverity - average);
      const percentDiff = difference / average;

      // If significantly different, create insight
      if (percentDiff >= SIGNIFICANT_DIFFERENCE_THRESHOLD) {
        const isBetter = currentSeverity < average;
        const direction = isBetter ? 'below' : 'above';
        const sentiment = isBetter
          ? "you're trending better than usual"
          : "that's higher than usual";

        return {
          type: 'data_context',
          title: "Today's Context",
          message: `Your ${symptomName} (${currentSeverity}/10) is ${direction} your 2-week average of ${average.toFixed(1)}.\n${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}.`,
          icon: '📊',
          metadata: {
            symptomName,
            currentValue: currentSeverity,
            averageValue: average,
            percentDifference: percentDiff,
            isBetter,
          },
        };
      }
    }
  }

  // Fallback: streak or milestone info
  const milestones = await getCheckInMilestones(userId);

  if (milestones.currentStreak >= 3) {
    return {
      type: 'data_context',
      title: 'Consistency Win',
      message: `You've now checked in ${milestones.currentStreak} days in a row.\nPatterns emerge from commitment like this.`,
      icon: '📊',
      metadata: {
        streakLength: milestones.currentStreak,
      },
    };
  }

  return null;
}

/**
 * Generate a validation card acknowledging effort and milestones
 */
export async function generateValidationCard(
  userId: string,
  checkIn: ICheckIn
): Promise<InsightCard> {
  const milestones = await getCheckInMilestones(userId);

  // Milestone message (highest priority)
  if (milestones.isMilestone) {
    return {
      type: 'validation',
      title: 'Milestone Reached',
      message: `This is your ${milestones.milestoneNumber}th check-in.\nYou're building a valuable health record for yourself.`,
      icon: '💚',
      metadata: {
        checkInCount: milestones.totalCheckIns,
        milestone: milestones.milestoneNumber,
      },
    };
  }

  // Check severity to provide contextual validation
  const symptoms = checkIn.structured?.symptoms;
  let maxSeverity = 0;

  if (symptoms) {
    const severities: number[] = [];

    if (symptoms instanceof Map) {
      symptoms.forEach((value) => {
        if (value && typeof value === 'object' && 'severity' in value) {
          const severity = Number(value.severity);
          if (!isNaN(severity)) severities.push(severity);
        }
      });
    } else {
      Object.values(symptoms).forEach((value) => {
        if (value && typeof value === 'object' && 'severity' in value) {
          const severity = Number(value.severity);
          if (!isNaN(severity)) severities.push(severity);
        }
      });
    }

    if (severities.length > 0) {
      maxSeverity = Math.max(...severities);
    }
  }

  // High severity validation
  if (maxSeverity >= 7) {
    return {
      type: 'validation',
      title: 'You Showed Up',
      message: `Managing a ${maxSeverity}/10 symptom day while staying consistent?\nThat takes real strength. We see you.`,
      icon: '💚',
      metadata: {
        maxSeverity,
        checkInCount: milestones.totalCheckIns,
      },
    };
  }

  // Default validation messages (rotate based on count)
  const defaultMessages = [
    {
      title: 'You Showed Up',
      message: `You checked in today even when it's hard.\nEvery data point helps your future care.`,
    },
    {
      title: 'Effort Recognized',
      message: `Building ${milestones.totalCheckIns} check-ins of data.\nYour patterns are becoming clearer.`,
    },
    {
      title: 'Progress Recognition',
      message: `Consistency like this builds the most valuable patterns.\nYou're doing great.`,
    },
  ];

  const messageIndex = milestones.totalCheckIns % defaultMessages.length;
  const selectedMessage = defaultMessages[messageIndex];

  return {
    type: 'validation',
    title: selectedMessage.title,
    message: selectedMessage.message,
    icon: '💚',
    metadata: {
      checkInCount: milestones.totalCheckIns,
      maxSeverity,
    },
  };
}

/**
 * Main orchestrator: Generate appropriate insight for a check-in
 * Priority: Pattern > Data Context > Validation (fallback)
 */
export async function generatePostCheckInInsight(
  userId: string,
  checkInId: string
): Promise<InsightCard> {
  const checkIn = await CheckIn.findById(checkInId);

  if (!checkIn) {
    throw new Error('Check-in not found');
  }

  // TODO Phase 2: Pattern detection (highest priority)
  // const patternCard = await generatePatternCard(userId);
  // if (patternCard) return patternCard;

  // Try data context card
  const dataContextCard = await generateDataContextCard(userId, checkIn);
  if (dataContextCard) return dataContextCard;

  // Fallback to validation card (always available)
  return generateValidationCard(userId, checkIn);
}
