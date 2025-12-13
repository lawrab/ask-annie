/**
 * Summary Analysis Service
 *
 * Generates comprehensive doctor summary reports with symptom analysis,
 * good/bad day tracking, and correlation analysis.
 */

import { Types } from 'mongoose';
import CheckIn, { ICheckInData, SymptomValue } from '../../models/CheckIn';
import { extractSeverity, formatDateKey } from './utils';
import {
  DoctorSummary,
  SymptomSummaryEntry,
  GoodBadDayAnalysis,
  DayQualityEntry,
  DayQuality,
  CorrelationEntry,
} from './types';

/**
 * Generate comprehensive doctor summary for a time period
 *
 * @param userId - User ID
 * @param startDate - Start date (ISO string or Date)
 * @param endDate - End date (ISO string or Date)
 * @param flaggedOnly - Only include flagged check-ins (default: false)
 * @returns Doctor summary with symptom analysis, good/bad days, and correlations
 */
export async function generateDoctorSummary(
  userId: string | Types.ObjectId,
  startDate: string | Date,
  endDate: string | Date,
  flaggedOnly: boolean = false
): Promise<DoctorSummary> {
  const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // Build query filter
  const filter: {
    userId: Types.ObjectId;
    timestamp: { $gte: Date; $lte: Date };
    flaggedForDoctor?: boolean;
  } = {
    userId: userObjectId,
    timestamp: {
      $gte: start,
      $lte: end,
    },
  };

  if (flaggedOnly) {
    filter.flaggedForDoctor = true;
  }

  // Fetch all check-ins in the period
  const checkIns = await CheckIn.find(filter).sort({ timestamp: 1 }).lean();

  // Calculate period metrics
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const flaggedCheckins = checkIns.filter((c) => c.flaggedForDoctor).length;
  const uniqueSymptoms = new Set(checkIns.flatMap((c) => Object.keys(c.structured.symptoms))).size;

  // Get unique dates with check-ins
  const datesWithCheckins = new Set(checkIns.map((c) => formatDateKey(c.timestamp)));

  // Generate symptom summary
  const symptomSummary = generateSymptomSummary(checkIns);

  // Generate good/bad day analysis
  const goodBadDayAnalysis = analyzeGoodBadDays(checkIns, start, end);

  // Generate correlations
  const correlations = analyzeCorrelations(checkIns);

  // Get flagged entries
  const flaggedEntries = checkIns
    .filter((c) => c.flaggedForDoctor)
    .map((c) => {
      const symptoms = c.structured.symptoms;
      const symptomsMap = symptoms instanceof Map ? symptoms : new Map(Object.entries(symptoms));

      return {
        timestamp: c.timestamp.toISOString(),
        symptoms: Object.fromEntries(symptomsMap.entries()),
        activities: c.structured.activities,
        triggers: c.structured.triggers,
        notes: c.structured.notes,
        rawTranscript: c.rawTranscript,
      };
    });

  return {
    period: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalDays,
    },
    overview: {
      totalCheckins: checkIns.length,
      flaggedCheckins,
      uniqueSymptoms,
      daysWithCheckins: datesWithCheckins.size,
    },
    symptomSummary,
    goodBadDayAnalysis,
    correlations,
    flaggedEntries,
  };
}

/**
 * Generate symptom summary with min/max/avg and date ranges
 */
function generateSymptomSummary(checkIns: ICheckInData[]): SymptomSummaryEntry[] {
  const symptomData = new Map<
    string,
    {
      severities: number[];
      dates: Date[];
    }
  >();

  // Get all unique dates to calculate frequency
  const allDates = new Set(checkIns.map((c) => formatDateKey(c.timestamp)));

  // Collect all symptom occurrences
  for (const checkIn of checkIns) {
    const symptoms = checkIn.structured.symptoms;
    const symptomsMap = symptoms instanceof Map ? symptoms : new Map(Object.entries(symptoms));

    symptomsMap.forEach((value: SymptomValue, name: string) => {
      const severity = extractSeverity(value);
      if (severity !== null) {
        if (!symptomData.has(name)) {
          symptomData.set(name, { severities: [], dates: [] });
        }
        const data = symptomData.get(name)!;
        data.severities.push(severity);
        data.dates.push(checkIn.timestamp);
      }
    });
  }

  // Calculate statistics for each symptom
  const summary: SymptomSummaryEntry[] = [];
  symptomData.forEach((data, symptom) => {
    const severities = data.severities;
    const dates = data.dates;

    // Calculate trend by comparing first half to second half
    const midpoint = Math.floor(severities.length / 2);
    const firstHalf = severities.slice(0, midpoint);
    const secondHalf = severities.slice(midpoint);

    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const change = secondAvg - firstAvg;

      // Use 10% threshold for stability
      if (Math.abs(change) >= 0.6) {
        // 10% of 6 (middle of 1-10 scale)
        trend = change > 0 ? 'worsening' : 'improving';
      }
    }

    // Calculate frequency as percentage of unique dates with this symptom
    const symptomDates = new Set(dates.map((d) => formatDateKey(d)));
    const frequency = Math.round((symptomDates.size / allDates.size) * 1000) / 10;

    summary.push({
      symptom,
      count: severities.length,
      minSeverity: Math.min(...severities),
      maxSeverity: Math.max(...severities),
      avgSeverity:
        Math.round((severities.reduce((a, b) => a + b, 0) / severities.length) * 10) / 10,
      firstReported: new Date(Math.min(...dates.map((d) => d.getTime())))
        .toISOString()
        .split('T')[0],
      lastReported: new Date(Math.max(...dates.map((d) => d.getTime())))
        .toISOString()
        .split('T')[0],
      trend,
      frequency,
    });
  });

  // Sort by frequency (most frequent first)
  return summary.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Analyze good vs bad days with interpolation for missing days
 *
 * Bad day criteria: any symptom >= 7 OR average symptoms >= 6
 */
function analyzeGoodBadDays(
  checkIns: ICheckInData[],
  startDate: Date,
  endDate: Date
): GoodBadDayAnalysis {
  // Group check-ins by day
  const dayMap = new Map<string, ICheckInData[]>();
  for (const checkIn of checkIns) {
    const dateKey = formatDateKey(checkIn.timestamp);
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, []);
    }
    dayMap.get(dateKey)!.push(checkIn);
  }

  // Create daily quality entries
  const dailyQuality: DayQualityEntry[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateKey = formatDateKey(current);
    const dayCheckIns = dayMap.get(dateKey) || [];

    if (dayCheckIns.length > 0) {
      // Day has check-ins, classify based on symptoms
      const allSeverities: number[] = [];
      const symptomNames = new Set<string>();

      for (const checkIn of dayCheckIns) {
        const symptoms = checkIn.structured.symptoms;
        const symptomsMap = symptoms instanceof Map ? symptoms : new Map(Object.entries(symptoms));

        symptomsMap.forEach((value: SymptomValue, name: string) => {
          symptomNames.add(name);
          const severity = extractSeverity(value);
          if (severity !== null) {
            allSeverities.push(severity);
          }
        });
      }

      const maxSeverity = allSeverities.length > 0 ? Math.max(...allSeverities) : 0;
      const avgSeverity =
        allSeverities.length > 0
          ? allSeverities.reduce((a, b) => a + b, 0) / allSeverities.length
          : 0;

      // Bad day if: any symptom >= 7 OR average >= 6
      const quality: DayQuality = maxSeverity >= 7 || avgSeverity >= 6 ? 'bad' : 'good';

      dailyQuality.push({
        date: dateKey,
        quality,
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        maxSeverity,
        symptomCount: symptomNames.size,
        hasCheckIn: true,
      });
    } else {
      // Day has no check-ins, will interpolate later
      dailyQuality.push({
        date: dateKey,
        quality: 'good', // Placeholder, will be updated
        avgSeverity: 0,
        maxSeverity: 0,
        symptomCount: 0,
        hasCheckIn: false,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  // Interpolate missing days based on surrounding days
  for (let i = 0; i < dailyQuality.length; i++) {
    if (!dailyQuality[i].hasCheckIn) {
      const quality = interpolateDayQuality(dailyQuality, i);
      dailyQuality[i].quality = quality;
    }
  }

  // Calculate statistics
  const goodDays = dailyQuality.filter((d) => d.quality.includes('good')).length;
  const badDays = dailyQuality.filter((d) => d.quality.includes('bad')).length;

  const avgTimeBetweenGoodDays = calculateAvgTimeBetween(dailyQuality, (d) =>
    d.quality.includes('good')
  );
  const avgTimeBetweenBadDays = calculateAvgTimeBetween(dailyQuality, (d) =>
    d.quality.includes('bad')
  );

  const { avgStreakLength, longestStreak } = calculateBadDayStreaks(dailyQuality);

  return {
    totalGoodDays: goodDays,
    totalBadDays: badDays,
    avgTimeBetweenGoodDays,
    avgTimeBetweenBadDays,
    avgBadDayStreakLength: avgStreakLength,
    longestBadDayStreak: longestStreak,
    dailyQuality,
  };
}

/**
 * Interpolate day quality based on surrounding days
 */
function interpolateDayQuality(dailyQuality: DayQualityEntry[], index: number): DayQuality {
  // Find nearest days with check-ins before and after
  let before: DayQualityEntry | null = null;
  let after: DayQualityEntry | null = null;

  for (let i = index - 1; i >= 0; i--) {
    if (dailyQuality[i].hasCheckIn) {
      before = dailyQuality[i];
      break;
    }
  }

  for (let i = index + 1; i < dailyQuality.length; i++) {
    if (dailyQuality[i].hasCheckIn) {
      after = dailyQuality[i];
      break;
    }
  }

  // If both before and after exist, use the worse one (more conservative)
  if (before && after) {
    const beforeIsBad = before.quality === 'bad';
    const afterIsBad = after.quality === 'bad';

    if (beforeIsBad || afterIsBad) {
      return 'interpolated_bad';
    } else {
      return 'interpolated_good';
    }
  }

  // If only before exists, use it
  if (before) {
    return before.quality === 'bad' ? 'interpolated_bad' : 'interpolated_good';
  }

  // If only after exists, use it
  if (after) {
    return after.quality === 'bad' ? 'interpolated_bad' : 'interpolated_good';
  }

  // No surrounding data, default to good
  return 'interpolated_good';
}

/**
 * Calculate average time between occurrences
 */
function calculateAvgTimeBetween(
  dailyQuality: DayQualityEntry[],
  predicate: (entry: DayQualityEntry) => boolean
): number {
  const indices = dailyQuality
    .map((entry, index) => (predicate(entry) ? index : -1))
    .filter((i) => i !== -1);

  if (indices.length < 2) {
    return 0;
  }

  let totalGaps = 0;
  for (let i = 1; i < indices.length; i++) {
    totalGaps += indices[i] - indices[i - 1];
  }

  return Math.round((totalGaps / (indices.length - 1)) * 10) / 10;
}

/**
 * Calculate bad day streak statistics
 */
function calculateBadDayStreaks(dailyQuality: DayQualityEntry[]): {
  avgStreakLength: number;
  longestStreak: number;
} {
  const streaks: number[] = [];
  let currentStreak = 0;

  for (const day of dailyQuality) {
    if (day.quality.includes('bad')) {
      currentStreak++;
    } else {
      if (currentStreak > 0) {
        streaks.push(currentStreak);
        currentStreak = 0;
      }
    }
  }

  // Add final streak if exists
  if (currentStreak > 0) {
    streaks.push(currentStreak);
  }

  if (streaks.length === 0) {
    return { avgStreakLength: 0, longestStreak: 0 };
  }

  const avgStreakLength =
    Math.round((streaks.reduce((a, b) => a + b, 0) / streaks.length) * 10) / 10;
  const longestStreak = Math.max(...streaks);

  return { avgStreakLength, longestStreak };
}

/**
 * Analyze correlations between symptoms and activities/triggers
 */
function analyzeCorrelations(checkIns: ICheckInData[]): CorrelationEntry[] {
  const correlations: CorrelationEntry[] = [];

  // Track co-occurrences of items (activities/triggers) with symptoms
  const itemOccurrences = new Map<string, number>();
  const symptomItemPairs = new Map<string, number>();

  for (const checkIn of checkIns) {
    const symptoms = checkIn.structured.symptoms;
    const symptomsMap = symptoms instanceof Map ? symptoms : new Map(Object.entries(symptoms));
    const symptomNames = Array.from(symptomsMap.keys());

    // Track activities
    for (const activity of checkIn.structured.activities) {
      const itemKey = `activity:${activity}`;
      itemOccurrences.set(itemKey, (itemOccurrences.get(itemKey) || 0) + 1);

      // Track co-occurrence with each symptom
      for (const symptom of symptomNames) {
        const pairKey = `${itemKey}:${symptom}`;
        symptomItemPairs.set(pairKey, (symptomItemPairs.get(pairKey) || 0) + 1);
      }
    }

    // Track triggers
    for (const trigger of checkIn.structured.triggers) {
      const itemKey = `trigger:${trigger}`;
      itemOccurrences.set(itemKey, (itemOccurrences.get(itemKey) || 0) + 1);

      // Track co-occurrence with each symptom
      for (const symptom of symptomNames) {
        const pairKey = `${itemKey}:${symptom}`;
        symptomItemPairs.set(pairKey, (symptomItemPairs.get(pairKey) || 0) + 1);
      }
    }
  }

  // Calculate correlation strength for each pair
  symptomItemPairs.forEach((coOccurrenceCount, pairKey) => {
    const [itemKeyWithType, symptom] = pairKey.split(':').reduce(
      (acc, part, i, arr) => {
        if (i === 0) return [part, ''];
        if (i === 1) return [`${acc[0]}:${part}`, ''];
        return [acc[0], arr.slice(2).join(':')];
      },
      ['', '']
    );

    const [itemType, item] = itemKeyWithType.split(':');
    const totalItemOccurrences = itemOccurrences.get(itemKeyWithType) || 0;
    const correlationStrength = Math.round((coOccurrenceCount / totalItemOccurrences) * 100);

    // Only include correlations with at least 3 co-occurrences and 30% strength
    if (coOccurrenceCount >= 3 && correlationStrength >= 30) {
      correlations.push({
        item,
        itemType: itemType as 'activity' | 'trigger',
        symptom,
        coOccurrenceCount,
        totalItemOccurrences,
        correlationStrength,
      });
    }
  });

  // Sort by correlation strength (strongest first)
  return correlations.sort((a, b) => b.correlationStrength - a.correlationStrength);
}
