import mongoose from 'mongoose';
import CheckIn from '../models/CheckIn';
import { logger } from '../utils/logger';

/**
 * Migration script to convert old symptom formats to standardized SymptomValue format
 *
 * Old formats:
 * - { headache: 5 } - plain numbers
 * - { headache: 'bad' } - categorical strings
 * - { headache: true } - boolean presence
 *
 * New format:
 * - { headache: { severity: 5, location?: string, notes?: string } }
 */

/**
 * Convert categorical severity to numeric 1-10 scale
 */
function categoricalToNumeric(category: string): number {
  const severityMap: { [key: string]: number } = {
    // Low severity (1-3) - good/minimal symptoms
    good: 1,
    great: 1,
    fine: 2,
    excellent: 1,
    normal: 2,
    strong: 1,
    high: 2,
    rested: 2,
    // Medium severity (4-7)
    moderate: 5,
    okay: 5,
    ok: 5,
    fair: 5,
    middling: 5,
    medium: 5,
    light: 4,
    // High severity (8-10) - bad/intense symptoms
    bad: 10,
    terrible: 10,
    awful: 10,
    poor: 8,
    weak: 8,
    horrible: 10,
    low: 9,
    tired: 8,
    exhausted: 9,
    drained: 9,
  };

  return severityMap[category.toLowerCase()] || 5;
}

/**
 * Convert old symptom value to new SymptomValue format
 */
function convertSymptomValue(value: any): { severity: number; location?: string; notes?: string } {
  // Already in new format
  if (typeof value === 'object' && value !== null && 'severity' in value) {
    return value;
  }

  // Plain number (1-10 scale)
  if (typeof value === 'number') {
    return { severity: Math.min(Math.max(value, 1), 10) };
  }

  // Boolean (presence indicates moderate-high severity)
  if (typeof value === 'boolean') {
    return { severity: value ? 7 : 1 };
  }

  // Categorical string
  if (typeof value === 'string') {
    return { severity: categoricalToNumeric(value) };
  }

  // Unknown format - default to moderate severity
  logger.warn('Unknown symptom value format', { value });
  return { severity: 5 };
}

/**
 * Migrate all check-ins to new symptom format
 */
async function migrateSymptomFormat(): Promise<void> {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ask-annie';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB', { uri: mongoUri });

    // Find all check-ins
    const checkIns = await CheckIn.find({});
    logger.info('Found check-ins to migrate', { count: checkIns.length });

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each check-in
    for (const checkIn of checkIns) {
      try {
        let needsMigration = false;
        const newSymptoms: {
          [key: string]: { severity: number; location?: string; notes?: string };
        } = {};

        // Check if symptoms need migration
        if (checkIn.structured?.symptoms) {
          const symptomsObj =
            checkIn.structured.symptoms instanceof Map
              ? Object.fromEntries(checkIn.structured.symptoms)
              : checkIn.structured.symptoms;

          for (const [symptomKey, symptomValue] of Object.entries(symptomsObj)) {
            const converted = convertSymptomValue(symptomValue);
            newSymptoms[symptomKey] = converted;

            // Check if conversion changed the value
            if (JSON.stringify(converted) !== JSON.stringify(symptomValue)) {
              needsMigration = true;
            }
          }
        }

        if (needsMigration) {
          // Update the check-in with new symptom format
          checkIn.structured.symptoms = newSymptoms as any;
          await checkIn.save();

          migratedCount++;
          logger.debug('Migrated check-in', {
            checkInId: checkIn._id,
            userId: checkIn.userId,
            symptomsCount: Object.keys(newSymptoms).length,
          });
        } else {
          skippedCount++;
        }
      } catch (error) {
        errorCount++;
        logger.error('Error migrating check-in', {
          checkInId: checkIn._id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Summary
    logger.info('Migration completed', {
      total: checkIns.length,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount,
    });
  } catch (error) {
    logger.error('Migration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    // Close database connection
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateSymptomFormat()
    .then(() => {
      logger.info('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed', { error });
      process.exit(1);
    });
}

export { migrateSymptomFormat };
