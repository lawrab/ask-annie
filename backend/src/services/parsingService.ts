import { logger } from '../utils/logger';

/**
 * Structured data extracted from transcript
 */
export interface ParsedSymptoms {
  symptoms: { [key: string]: unknown };
  activities: string[];
  triggers: string[];
  notes: string;
}

/**
 * Common symptom patterns with their possible values
 */
const SYMPTOM_PATTERNS = {
  // Hand-related symptoms
  hand_grip: {
    keywords: ['hand grip', 'grip', 'hands', 'hand strength', 'gripping'],
    values: {
      bad: ['bad', 'terrible', 'awful', 'poor', 'weak', 'horrible'],
      moderate: ['moderate', 'okay', 'ok', 'fair', 'middling', 'so-so'],
      good: ['good', 'great', 'strong', 'fine', 'excellent', 'normal'],
    },
  },

  // Pain level (1-10 scale)
  pain_level: {
    keywords: ['pain', 'hurt', 'ache', 'aching', 'sore', 'discomfort'],
    numeric: true,
  },

  // Energy level
  energy: {
    keywords: ['energy', 'tired', 'fatigue', 'exhausted', 'energetic'],
    values: {
      low: ['low', 'tired', 'exhausted', 'drained', 'wiped', 'sleepy'],
      medium: ['medium', 'moderate', 'okay', 'ok', 'average'],
      high: ['high', 'energetic', 'good', 'great', 'peppy', 'alert'],
    },
  },

  // Raynaud's events
  raynauds_event: {
    keywords: ['raynaud', 'raynauds', 'fingers white', 'fingers blue', 'cold fingers'],
    boolean: true,
  },

  // Activity level
  activity_level: {
    keywords: ['activity', 'active', 'movement', 'exercise', 'exertion', 'rested', 'rest', 'light', 'intense', 'workout'],
    values: {
      rested: ['rested', 'rest', 'relaxed', 'inactive', 'sedentary'],
      light: ['light', 'gentle', 'easy', 'minimal'],
      normal: ['normal', 'moderate', 'regular', 'usual'],
      high: ['high', 'intense', 'strenuous', 'vigorous', 'heavy'],
    },
  },

  // Additional common symptoms
  brain_fog: {
    keywords: ['brain fog', 'foggy', 'confused', 'fuzzy', 'clarity', 'mental'],
    boolean: true,
  },

  tingling_feet: {
    keywords: ['tingling feet', 'feet tingling', 'numb feet', 'feet numb', 'feet are tingling', 'my feet are tingling'],
    boolean: true,
  },

  neck_stiffness: {
    keywords: ['neck stiff', 'stiff neck', 'neck pain', 'neck ache', 'neck is stiff', 'neck is really stiff'],
    boolean: true,
  },
};

/**
 * Common activities to detect
 */
const ACTIVITY_KEYWORDS = [
  'walking',
  'walk',
  'running',
  'run',
  'exercise',
  'workout',
  'yoga',
  'swimming',
  'housework',
  'cleaning',
  'cooking',
  'gardening',
  'work',
  'working',
  'resting',
  'sleeping',
  'reading',
  'writing',
  'typing',
  'driving',
  'shopping',
];

/**
 * Common triggers to detect
 */
const TRIGGER_KEYWORDS = [
  'stress',
  'stressed',
  'anxiety',
  'anxious',
  'cold',
  'heat',
  'weather',
  'sleep',
  'lack of sleep',
  'insomnia',
  'food',
  'alcohol',
  'caffeine',
  'medication',
  'hormones',
  'period',
  'menstruation',
];

/**
 * Extract numeric value from text (for pain levels, etc.)
 */
function extractNumericValue(text: string, context: string): number | null {
  // Look for patterns like "pain 7", "7 out of 10", "pain around 5", "around 3 out of 10"
  const patterns = [
    /(\d+)\s*(?:out of|\/)\s*10/i,
    /(?:level|around|about|roughly)?\s*(\d+)(?:\s*(?:out of|\/)\s*10)?/i,
  ];

  const lowerText = text.toLowerCase();
  const contextIndex = lowerText.indexOf(context.toLowerCase());

  if (contextIndex === -1) return null;

  // Search in a window around the keyword (wider window to catch "around 3 out of 10")
  const windowStart = Math.max(0, contextIndex - 30);
  const windowEnd = Math.min(text.length, contextIndex + context.length + 40);
  const window = text.substring(windowStart, windowEnd);

  for (const pattern of patterns) {
    const match = window.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      if (value >= 0 && value <= 10) {
        return value;
      }
    }
  }

  return null;
}

/**
 * Check if text contains any of the keywords
 */
function containsKeyword(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Extract value from text based on value keywords
 */
function extractValue(text: string, valueMap: { [key: string]: string[] }): string | null {
  const lowerText = text.toLowerCase();

  for (const [value, keywords] of Object.entries(valueMap)) {
    if (containsKeyword(lowerText, keywords)) {
      return value;
    }
  }

  return null;
}

/**
 * Parse transcript into structured symptom data
 */
export function parseSymptoms(transcript: string): ParsedSymptoms {
  const symptoms: { [key: string]: unknown } = {};
  const activities: string[] = [];
  const triggers: string[] = [];

  logger.info('Parsing transcript', { transcriptLength: transcript.length });

  // Extract known symptoms
  for (const [symptomKey, config] of Object.entries(SYMPTOM_PATTERNS)) {
    // Check if any keywords are present
    if (!containsKeyword(transcript, config.keywords)) {
      continue;
    }

    // Extract value based on type
    if ('numeric' in config && config.numeric) {
      // Extract numeric value
      const numericValue = extractNumericValue(transcript, config.keywords[0]);
      if (numericValue !== null) {
        symptoms[symptomKey] = numericValue;
        logger.debug('Extracted numeric symptom', { symptomKey, value: numericValue });
      }
    } else if ('boolean' in config && config.boolean) {
      // Boolean symptom - presence indicates true
      symptoms[symptomKey] = true;
      logger.debug('Extracted boolean symptom', { symptomKey, value: true });
    } else if ('values' in config && config.values) {
      // Extract categorical value
      const value = extractValue(transcript, config.values);
      if (value) {
        symptoms[symptomKey] = value;
        logger.debug('Extracted categorical symptom', { symptomKey, value });
      }
    }
  }

  // Extract activities
  for (const activity of ACTIVITY_KEYWORDS) {
    if (containsKeyword(transcript, [activity])) {
      activities.push(activity);
      logger.debug('Detected activity', { activity });
    }
  }

  // Extract triggers
  for (const trigger of TRIGGER_KEYWORDS) {
    if (containsKeyword(transcript, [trigger])) {
      triggers.push(trigger);
      logger.debug('Detected trigger', { trigger });
    }
  }

  // Store original transcript as notes
  const notes = transcript.trim();

  logger.info('Parsing complete', {
    symptomCount: Object.keys(symptoms).length,
    activityCount: activities.length,
    triggerCount: triggers.length,
  });

  return {
    symptoms,
    activities,
    triggers,
    notes,
  };
}

/**
 * Calculate parsing confidence score (0-100)
 * Based on number of symptoms detected and clarity of input
 */
export function calculateConfidence(parsed: ParsedSymptoms): number {
  let score = 0;

  // Points for each detected symptom (up to 60 points)
  const symptomCount = Object.keys(parsed.symptoms).length;
  score += Math.min(symptomCount * 15, 60);

  // Points for activities (up to 20 points)
  const activityCount = parsed.activities.length;
  score += Math.min(activityCount * 10, 20);

  // Points for triggers (up to 20 points)
  const triggerCount = parsed.triggers.length;
  score += Math.min(triggerCount * 10, 20);

  return Math.min(score, 100);
}
