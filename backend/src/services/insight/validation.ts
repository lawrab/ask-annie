/**
 * Validation Module
 *
 * Generates validation insight cards that acknowledge
 * user effort and celebrate milestones.
 */

import { ICheckIn } from '../../models/CheckIn';
import { InsightCard } from '../../types';
import { VALIDATION_CONSTANTS } from '../../constants';
import { getCheckInMilestones } from './milestones';

/**
 * Generate a validation card acknowledging effort and milestones
 *
 * @param userId - The user's ID
 * @param checkIn - The current check-in document
 * @returns Validation insight card (always returns a card)
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
      icon: '\u{1F49A}',
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
  if (maxSeverity >= VALIDATION_CONSTANTS.HIGH_SEVERITY_THRESHOLD) {
    return {
      type: 'validation',
      title: 'You Showed Up',
      message: `Managing a ${maxSeverity}/${VALIDATION_CONSTANTS.MAX_SYMPTOM_SEVERITY} symptom day while staying consistent?\nThat takes real strength. We see you.`,
      icon: '\u{1F49A}',
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
    icon: '\u{1F49A}',
    metadata: {
      checkInCount: milestones.totalCheckIns,
      maxSeverity,
    },
  };
}
