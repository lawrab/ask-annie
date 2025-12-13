/**
 * Seed script to add test check-in data for doctor summary feature testing
 *
 * Usage: npm run seed-test-data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import CheckIn from '../models/CheckIn';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/annies-health-journal';

// Test data configuration
const TEST_USER_EMAIL = 'lrabbets@gmail.com';
const DAYS_OF_DATA = 45;

async function seedTestData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ email: TEST_USER_EMAIL });
    if (!user) {
      console.error(`User with email ${TEST_USER_EMAIL} not found!`);
      console.log('Please create this user first.');
      process.exit(1);
    }

    console.log(`Found user: ${user.username} (${user.email})`);

    // Delete existing check-ins for this user
    const deleteResult = await CheckIn.deleteMany({ userId: user._id });
    console.log(`Deleted ${deleteResult.deletedCount} existing check-ins`);

    // Generate test check-ins
    const checkIns = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = DAYS_OF_DATA - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Skip some days to test interpolation (skip every 7th day)
      if (i % 7 === 0 && i !== 0) {
        continue;
      }

      // Create patterns for different periods
      const dayOfPeriod = i % 14;
      let checkIn;

      if (i >= 30) {
        // First 15 days: Higher severity, worsening trend
        checkIn = createCheckIn(user._id, date, 'early', dayOfPeriod);
      } else if (i >= 15) {
        // Middle 15 days: Peak severity with bad day streaks
        checkIn = createCheckIn(user._id, date, 'peak', dayOfPeriod);
      } else {
        // Last 15 days: Improving trend
        checkIn = createCheckIn(user._id, date, 'improving', dayOfPeriod);
      }

      checkIns.push(checkIn);
    }

    // Insert all check-ins
    console.log(`Creating ${checkIns.length} check-ins...`);
    await CheckIn.insertMany(checkIns);
    console.log(`Successfully created ${checkIns.length} check-ins!`);

    // Print summary
    const flaggedCount = checkIns.filter((c) => c.flaggedForDoctor).length;
    console.log('\nSummary:');
    console.log(`- Total check-ins: ${checkIns.length}`);
    console.log(`- Flagged entries: ${flaggedCount}`);
    console.log(
      `- Date range: ${checkIns[0].timestamp.toISOString().split('T')[0]} to ${checkIns[checkIns.length - 1].timestamp.toISOString().split('T')[0]}`
    );

    process.exit(0);
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

function createCheckIn(
  userId: mongoose.Types.ObjectId,
  date: Date,
  period: 'early' | 'peak' | 'improving',
  dayOfPeriod: number
) {
  // Set timestamp to a realistic time during the day
  const timestamp = new Date(date);
  timestamp.setHours(9 + (dayOfPeriod % 12), Math.floor(Math.random() * 60), 0, 0);

  // Base severity patterns by period
  const baseSeverity = {
    early: 4 + Math.random() * 2, // 4-6
    peak: 6 + Math.random() * 3, // 6-9
    improving: 2 + Math.random() * 3, // 2-5
  };

  const severity = Math.round(baseSeverity[period]);

  // Determine if this should be flagged (flag high severity days)
  const shouldFlag = severity >= 8 || (severity >= 7 && Math.random() > 0.5);

  // Symptoms vary by period and day
  const symptoms: Record<string, { severity: number; location?: string; notes?: string }> = {};

  // Primary symptom: back pain (appears frequently)
  if (dayOfPeriod % 3 !== 2) {
    symptoms.back_pain = {
      severity: Math.max(1, Math.min(10, severity + (Math.random() - 0.5) * 2)),
      location: 'lower back',
    };
  }

  // Secondary symptom: fatigue (correlates with bad days)
  if (severity >= 5) {
    symptoms.fatigue = {
      severity: Math.max(1, Math.min(10, severity + (Math.random() - 0.3) * 2)),
    };
  }

  // Occasional symptoms
  if (dayOfPeriod % 5 === 0) {
    symptoms.headache = {
      severity: Math.max(1, Math.min(10, severity - 1 + Math.random() * 2)),
      location: period === 'peak' ? 'temples' : undefined,
    };
  }

  if (period === 'peak' && dayOfPeriod % 4 === 0) {
    symptoms.joint_pain = {
      severity: Math.max(1, Math.min(10, severity + (Math.random() - 0.2) * 2)),
      location: 'knees',
    };
  }

  // Activities (some correlate with symptoms)
  const activities: string[] = [];
  if (dayOfPeriod % 3 === 0) activities.push('sitting'); // Correlates with back pain
  if (dayOfPeriod % 4 === 1) activities.push('walking');
  if (severity < 6) activities.push('stretching'); // Good days
  if (period === 'improving') activities.push('physical therapy');

  // Triggers (correlate with bad days)
  const triggers: string[] = [];
  if (severity >= 7) triggers.push('stress');
  if (severity >= 8) triggers.push('poor sleep');
  if (dayOfPeriod % 6 === 0 && severity >= 6) triggers.push('weather change');

  // Notes
  const notes =
    period === 'peak'
      ? 'Pain significantly worse today'
      : period === 'improving'
        ? 'Feeling better with treatment'
        : 'Managing symptoms';

  // Raw transcript
  const transcripts = {
    early: `I'm experiencing ${Object.keys(symptoms).join(' and ')} today. Severity is around ${severity} out of 10. ${activities.length > 0 ? `I've been ${activities.join(' and ')}.` : ''} ${notes}`,
    peak: `Today has been really difficult. My ${Object.keys(symptoms).join(', ')} are all acting up. Pain is at ${severity}/10. ${triggers.length > 0 ? `I think it's because of ${triggers.join(' and ')}.` : ''} ${notes}`,
    improving: `Feeling better today. ${Object.keys(symptoms).join(' and ')} are at a manageable ${severity}. ${activities.length > 0 ? `${activities.join(' and ')} helped.` : ''} ${notes}`,
  };

  return {
    userId,
    timestamp,
    rawTranscript: transcripts[period],
    structured: {
      symptoms,
      activities,
      triggers,
      notes,
    },
    flaggedForDoctor: shouldFlag,
  };
}

// Run the seed script
seedTestData();
