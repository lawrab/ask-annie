import mongoose from 'mongoose';
import CheckIn from '../src/models/CheckIn';

/**
 * Script to analyze alpha testing check-in data
 * Usage: npx ts-node scripts/check-alpha-stats.ts <MONGODB_URI>
 */

interface DailyCount {
  date: string;
  count: number;
  voiceCount: number;
  manualCount: number;
}

async function analyzeAlphaStats(mongoUri: string) {
  try {
    console.log('Connecting to production database...');
    await mongoose.connect(mongoUri);
    console.log('Connected!\n');

    // Get all check-ins sorted by timestamp
    const checkIns = await CheckIn.find({})
      .sort({ timestamp: 1 })
      .select('timestamp rawTranscript createdAt')
      .lean();

    if (checkIns.length === 0) {
      console.log('No check-ins found in database.');
      await mongoose.disconnect();
      return;
    }

    // Group by date
    const dailyCounts = new Map<string, DailyCount>();

    checkIns.forEach((checkIn) => {
      const date = checkIn.timestamp.toISOString().split('T')[0];

      if (!dailyCounts.has(date)) {
        dailyCounts.set(date, {
          date,
          count: 0,
          voiceCount: 0,
          manualCount: 0,
        });
      }

      const dayData = dailyCounts.get(date)!;
      dayData.count++;

      // Check if manual or voice
      if (checkIn.rawTranscript === 'manual entry') {
        dayData.manualCount++;
      } else {
        dayData.voiceCount++;
      }
    });

    // Sort by date
    const sortedDays = Array.from(dailyCounts.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Calculate stats
    const totalCheckIns = checkIns.length;
    const totalDays = sortedDays.length;
    const avgPerDay = (totalCheckIns / totalDays).toFixed(1);
    const totalVoice = sortedDays.reduce((sum, d) => sum + d.voiceCount, 0);
    const totalManual = sortedDays.reduce((sum, d) => sum + d.manualCount, 0);

    // Find first and last dates
    const firstDate = sortedDays[0].date;
    const lastDate = sortedDays[sortedDays.length - 1].date;

    // Print summary
    console.log('📊 ALPHA TESTING SUMMARY');
    console.log('========================\n');
    console.log(`Testing Period: ${firstDate} to ${lastDate}`);
    console.log(`Total Days: ${totalDays} days`);
    console.log(`Total Check-ins: ${totalCheckIns}`);
    console.log(`Average per Day: ${avgPerDay} check-ins`);
    console.log(`Voice Check-ins: ${totalVoice} (${((totalVoice/totalCheckIns)*100).toFixed(1)}%)`);
    console.log(`Manual Check-ins: ${totalManual} (${((totalManual/totalCheckIns)*100).toFixed(1)}%)`);
    console.log('\n📅 DAILY BREAKDOWN');
    console.log('==================\n');

    // Print daily breakdown
    sortedDays.forEach((day) => {
      const voiceLabel = day.voiceCount > 0 ? `🎤 ${day.voiceCount}` : '';
      const manualLabel = day.manualCount > 0 ? `✍️  ${day.manualCount}` : '';
      const labels = [voiceLabel, manualLabel].filter(l => l).join('  ');

      console.log(`${day.date}  |  ${day.count} total  |  ${labels}`);
    });

    console.log('\n✅ Analysis complete');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get MongoDB URI from command line argument
const mongoUri = process.argv[2];

if (!mongoUri) {
  console.error('Usage: npx ts-node scripts/check-alpha-stats.ts <MONGODB_URI>');
  console.error('Example: npx ts-node scripts/check-alpha-stats.ts "mongodb://..."');
  process.exit(1);
}

analyzeAlphaStats(mongoUri);
