import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { SymptomValue } from '../models/CheckIn';

/**
 * Structured data extracted from transcript
 */
export interface ParsedSymptoms {
  symptoms: { [key: string]: SymptomValue };
  activities: string[];
  triggers: string[];
  notes: string;
}

// Lazy initialization to support testing
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

const EXTRACTION_TOOL = {
  type: 'function' as const,
  function: {
    name: 'extract_symptoms',
    description: 'Extract structured symptom data from patient check-in text',
    parameters: {
      type: 'object',
      properties: {
        symptoms: {
          type: 'array',
          description: 'List of symptoms explicitly mentioned',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description:
                  "Symptom name in lowercase with underscores (e.g., 'headache', 'lower_back_pain', 'nausea')",
              },
              severity: {
                type: 'number',
                minimum: 1,
                maximum: 10,
                description:
                  "Severity on 1-10 scale. Extract from context: 'mild'=2-3, 'moderate'=5-6, 'severe'=8-9, or explicit numbers like '6 out of 10'.",
              },
              location: {
                type: 'string',
                description: "Body location if mentioned (e.g., 'temples', 'lower back')",
              },
              notes: {
                type: 'string',
                description: 'Additional context about this symptom',
              },
            },
            required: ['name', 'severity'],
          },
        },
        activities: {
          type: 'array',
          items: { type: 'string' },
          description: "List of activities mentioned (e.g., 'working', 'walking', 'exercising')",
        },
        triggers: {
          type: 'array',
          items: { type: 'string' },
          description:
            "List of potential triggers mentioned (e.g., 'stress', 'lack of sleep', 'screen time')",
        },
      },
      required: ['symptoms', 'activities', 'triggers'],
    },
  },
};

/**
 * Parse transcript into structured symptom data using GPT-4o-mini
 */
export async function parseSymptoms(transcript: string): Promise<ParsedSymptoms> {
  try {
    logger.info('Parsing transcript with GPT-4o-mini', {
      transcriptLength: transcript.length,
    });

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a medical data extraction assistant. Extract symptoms, activities, and triggers from patient check-in text.

IMPORTANT: You MUST extract all three fields - symptoms, activities, and triggers. Even if some are empty, include them.

Symptom Extraction Rules:
- Extract ALL symptoms explicitly mentioned (e.g., "headache", "nausea", "fatigue", "pain")
- Ignore negations like "no pain" or "I don't have"
- Map severity words to numbers: mild=2-3, moderate=5-6, severe=8-9, terrible=10
- Extract numeric severities exactly: "6 out of 10" → severity: 6
- Extract body locations when mentioned (e.g., "temples", "lower back")
- Use lowercase with underscores for symptom names (e.g., "lower_back_pain", "headache", "nausea")

Example:
Input: "moderate headache, 6 out of 10, in my temples. Mild nausea, maybe a 3"
Output: {
  "symptoms": [
    {"name": "headache", "severity": 6, "location": "temples"},
    {"name": "nausea", "severity": 3}
  ],
  "activities": [],
  "triggers": []
}`,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: 'function', function: { name: 'extract_symptoms' } },
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== 'function' || !toolCall.function?.arguments) {
      throw new Error('No function call in response');
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Convert array format to object format
    const symptoms: { [key: string]: SymptomValue } = {};
    if (Array.isArray(parsed.symptoms)) {
      for (const symptom of parsed.symptoms) {
        // Clamp severity to valid range [1, 10] in case GPT returns invalid values
        const clampedSeverity = Math.min(10, Math.max(1, symptom.severity));
        const symptomValue: SymptomValue = { severity: clampedSeverity };
        if (symptom.location) symptomValue.location = symptom.location;
        if (symptom.notes) symptomValue.notes = symptom.notes;
        symptoms[symptom.name] = symptomValue;
      }
    }

    logger.info('Parsing complete', {
      symptomCount: Object.keys(symptoms).length,
      activityCount: (parsed.activities || []).length,
      triggerCount: (parsed.triggers || []).length,
    });

    return {
      symptoms,
      activities: parsed.activities || [],
      triggers: parsed.triggers || [],
      notes: transcript, // Preserve original
    };
  } catch (error) {
    logger.error('GPT parsing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fail gracefully with empty extraction
    return {
      symptoms: {},
      activities: [],
      triggers: [],
      notes: transcript,
    };
  }
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
