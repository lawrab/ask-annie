/**
 * Insight Module
 *
 * Generates personalized insight cards after check-ins,
 * providing data context, validation, and pattern recognition.
 */

import CheckIn from '../../models/CheckIn';
import { InsightCard } from '../../types';
import { generateDataContextCard } from './dataContext';
import { generateValidationCard } from './validation';

// Re-export types
export { CheckInMilestones, MILESTONE_COUNTS, SIGNIFICANT_DIFFERENCE_THRESHOLD } from './types';

// Re-export functions
export { getCheckInMilestones } from './milestones';
export { calculateSymptomAverage, generateDataContextCard } from './dataContext';
export { generateValidationCard } from './validation';

/**
 * Main orchestrator: Generate appropriate insight for a check-in
 *
 * Priority order:
 * 1. Pattern detection (TODO Phase 2)
 * 2. Data context (comparison to historical averages)
 * 3. Validation (fallback - always available)
 *
 * @param userId - The user's ID
 * @param checkInId - The check-in document ID
 * @returns Appropriate insight card for the check-in
 * @throws Error if check-in not found
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
