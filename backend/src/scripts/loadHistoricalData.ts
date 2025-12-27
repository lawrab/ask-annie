/**
 * Load historical check-in data from JSON file
 *
 * Usage: npx ts-node src/scripts/loadHistoricalData.ts <mongodb-uri> <path-to-json> <user-email>
 *
 * Example:
 *   npx ts-node src/scripts/loadHistoricalData.ts \
 *     "mongodb+srv://user:pass@cluster.mongodb.net/dbname" \
 *     /path/to/data.json \
 *     user@example.com
 */

import mongoose from 'mongoose';
import fs from 'fs';
import User from '../models/User';
import CheckIn from '../models/CheckIn';

interface HistoricalSymptom {
  severity?: number | string;
  location?: string;
  present?: boolean;
  intermittent?: boolean;
  duration_minutes?: number;
  support_needed_minutes?: number;
  walking_distance_meters?: number;
  new_symptom?: boolean;
  [key: string]: any;
}

interface HistoricalCheckIn {
  timestamp: string;
  type: string;
  symptoms: Record<string, HistoricalSymptom | string | number | boolean>;
  activities: string[];
  triggers?: string[];
  notes: string;
}

interface HistoricalData {
  metadata: {
    description: string;
    generated: string;
    note: string;
    total_entries: number;
  };
  checkins: HistoricalCheckIn[];
}

/**
 * Normalize symptom data to match CheckIn model schema
 * The schema requires: { severity: number, location?: string, notes?: string }
 */
function normalizeSymptom(
  symptomName: string,
  symptomValue: HistoricalSymptom | string | number | boolean
): { severity: number; location?: string; notes?: string } | null {
  // If it's a direct numeric value (like "pain_level": 7)
  if (typeof symptomValue === 'number') {
    return {
      severity: Math.min(10, Math.max(1, symptomValue)),
    };
  }

  // If it's a boolean value (like "bad_day": true)
  if (typeof symptomValue === 'boolean') {
    return {
      severity: symptomValue ? 7 : 3, // true = bad (7), false = good (3)
      notes: symptomValue ? 'yes' : 'no',
    };
  }

  // If it's a string value (like "moderate", "poor", "severe"), convert to severity
  if (typeof symptomValue === 'string') {
    const severityMap: Record<string, number> = {
      // General severity descriptors
      minimal: 2,
      mild: 3,
      moderate: 5,
      poor: 7,
      very_poor: 8,
      severe: 8,
      extreme: 9,
      // Grip/ability descriptors
      none: 9,
      good: 3,
      fair: 5,
      // Mobility descriptors
      wheelchair_outdoors: 8,
      wheelchair_indoors: 9,
      needs_help_from_bed: 9,
      needs_full_help: 9,
      needs_support: 7,
    };
    const key = symptomValue.toLowerCase().replace(/\s+/g, '_');
    return {
      severity: severityMap[key] || 5,
      notes: symptomValue,
    };
  }

  // If it's an object, handle various sub-structures
  if (typeof symptomValue === 'object' && symptomValue !== null) {
    // If it has severity field
    if (symptomValue.severity !== undefined) {
      // Severity might be a string like "moderate" or a number
      if (typeof symptomValue.severity === 'string') {
        const severityMap: Record<string, number> = {
          minimal: 2,
          mild: 3,
          moderate: 5,
          poor: 7,
          severe: 8,
          extreme: 9,
        };
        const key = symptomValue.severity.toLowerCase();
        return {
          severity: severityMap[key] || 5,
          location: symptomValue.location,
        };
      }
      // Numeric severity
      return {
        severity: Math.min(10, Math.max(1, symptomValue.severity)),
        location: symptomValue.location,
      };
    }

    // If it's a boolean "present" field
    if (symptomValue.present !== undefined) {
      // Only create symptom if present is true, skip if false
      if (symptomValue.present === false) {
        return null;
      }
      return {
        severity: 5, // Default moderate severity
        location: symptomValue.location,
      };
    }

    // If it has intermittent field
    if (symptomValue.intermittent === true) {
      return {
        severity: 6, // Intermittent symptoms
        location: symptomValue.location,
        notes: 'intermittent',
      };
    }

    // If it has duration (like morning_stiffness), convert to severity
    if (symptomValue.duration_minutes !== undefined) {
      // More minutes = higher severity
      const severity = Math.min(10, Math.max(1, Math.ceil(symptomValue.duration_minutes / 10)));
      return {
        severity,
        notes: `${symptomValue.duration_minutes} minutes`,
      };
    }

    // If it has support_needed_minutes, convert to severity
    if (symptomValue.support_needed_minutes !== undefined) {
      // More minutes of support needed = higher severity
      const severity = Math.min(
        10,
        Math.max(1, Math.ceil(symptomValue.support_needed_minutes / 2))
      );
      return {
        severity,
        notes: `${symptomValue.support_needed_minutes} min support needed`,
      };
    }

    // If it has walking distance, convert to severity
    if (symptomValue.walking_distance_meters !== undefined) {
      // Less distance = higher severity
      // 0-20m = 9, 20-50m = 7, 50-100m = 5, 100+m = 3
      let severity = 3;
      if (symptomValue.walking_distance_meters <= 20) severity = 9;
      else if (symptomValue.walking_distance_meters <= 50) severity = 7;
      else if (symptomValue.walking_distance_meters <= 100) severity = 5;
      return {
        severity,
        notes: `${symptomValue.walking_distance_meters}m walking distance`,
      };
    }

    // If it's a nested object like { fatigue: 'severe' }, try to extract the value
    const keys = Object.keys(symptomValue);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const firstValue = symptomValue[firstKey];

      // If the value is a string descriptor, use it
      if (typeof firstValue === 'string') {
        const severityMap: Record<string, number> = {
          minimal: 2,
          mild: 3,
          moderate: 5,
          poor: 7,
          severe: 8,
          extreme: 9,
        };
        const key = firstValue.toLowerCase();
        return {
          severity: severityMap[key] || 5,
          notes: `${firstKey}: ${firstValue}`,
        };
      }
    }
  }

  // Skip symptoms we can't normalize
  console.warn(`Skipping symptom ${symptomName} - cannot normalize:`, symptomValue);
  return null;
}

async function loadHistoricalData() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    if (args.length < 3) {
      console.error(
        'Usage: npx ts-node src/scripts/loadHistoricalData.ts <mongodb-uri> <path-to-json> <user-email>'
      );
      console.error('');
      console.error('Example:');
      console.error('  npx ts-node src/scripts/loadHistoricalData.ts \\');
      console.error('    "mongodb+srv://user:pass@cluster.mongodb.net/dbname" \\');
      console.error('    /path/to/data.json \\');
      console.error('    user@example.com');
      process.exit(1);
    }

    const [mongoUri, jsonPath, userEmail] = args;

    // Check if file exists
    if (!fs.existsSync(jsonPath)) {
      console.error(`File not found: ${jsonPath}`);
      process.exit(1);
    }

    // Read and parse JSON file
    console.log(`Reading historical data from: ${jsonPath}`);
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const data: HistoricalData = JSON.parse(fileContent);

    console.log('\nMetadata:');
    console.log(`  Description: ${data.metadata.description}`);
    console.log(`  Total entries: ${data.metadata.total_entries}`);
    console.log(`  Generated: ${data.metadata.generated}`);

    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    console.log(
      `Database: ${mongoUri.includes('@') ? mongoUri.split('@')[1].split('/')[0] : 'localhost'}`
    );
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    if (!user) {
      console.error(`User with email ${userEmail} not found!`);
      console.log('Please create this user first.');
      process.exit(1);
    }

    console.log(`\nFound user: ${user.username} (${user.email})`);

    // Ask for confirmation
    console.log(`\nAbout to insert ${data.checkins.length} check-ins for this user.`);
    console.log('This will add to existing check-ins (not replace).');
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Process and insert check-ins
    console.log('\nProcessing check-ins...');
    let successCount = 0;
    let skipCount = 0;

    for (const checkIn of data.checkins) {
      try {
        // Normalize symptoms
        const normalizedSymptoms: Record<
          string,
          { severity: number; location?: string; notes?: string }
        > = {};

        for (const [symptomName, symptomValue] of Object.entries(checkIn.symptoms)) {
          const normalized = normalizeSymptom(symptomName, symptomValue);
          if (normalized) {
            normalizedSymptoms[symptomName] = normalized;
          }
        }

        // Only insert if we have at least one symptom
        if (Object.keys(normalizedSymptoms).length === 0) {
          console.warn(`Skipping check-in at ${checkIn.timestamp} - no valid symptoms`);
          skipCount++;
          continue;
        }

        // Upsert check-in (update if exists, create if doesn't)
        const timestamp = new Date(checkIn.timestamp);
        await CheckIn.findOneAndUpdate(
          {
            userId: user._id,
            timestamp: timestamp,
          },
          {
            userId: user._id,
            timestamp: timestamp,
            rawTranscript: checkIn.notes || 'Historical data import',
            structured: {
              symptoms: normalizedSymptoms,
              activities: checkIn.activities || [],
              triggers: checkIn.triggers || [],
              notes: checkIn.notes || '',
            },
            flaggedForDoctor: false,
          },
          {
            upsert: true, // Create if doesn't exist
            new: true,
          }
        );

        successCount++;
        if (successCount % 20 === 0) {
          console.log(`  Processed ${successCount} check-ins...`);
        }
      } catch (error) {
        console.error(`Error processing check-in at ${checkIn.timestamp}:`, error);
        skipCount++;
      }
    }

    console.log('\n✅ Import complete!');
    console.log(`  Successfully imported: ${successCount} check-ins`);
    console.log(`  Skipped: ${skipCount} check-ins`);

    // Show date range
    const timestamps = data.checkins.map((c) => new Date(c.timestamp));
    const earliest = new Date(Math.min(...timestamps.map((d) => d.getTime())));
    const latest = new Date(Math.max(...timestamps.map((d) => d.getTime())));
    console.log(
      `  Date range: ${earliest.toISOString().split('T')[0]} to ${latest.toISOString().split('T')[0]}`
    );

    process.exit(0);
  } catch (error) {
    console.error('Error loading historical data:', error);
    process.exit(1);
  }
}

// Run the script
loadHistoricalData();
