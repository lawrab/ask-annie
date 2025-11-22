import { Request, Response, NextFunction } from 'express';
import CheckIn from '../models/CheckIn';
import User from '../models/User';
import { transcribeAudio } from '../services/transcriptionService';
import { parseSymptoms } from '../services/parsingService';
import { logger } from '../utils/logger';
import fs from 'fs/promises';

/**
 * POST /api/checkins (voice)
 * Accepts audio file, transcribes it, parses symptoms, and stores check-in
 */
export async function createVoiceCheckin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let audioFilePath: string | undefined;

  try {
    // Validate file upload
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Audio file is required',
      });
      return;
    }

    audioFilePath = req.file.path;
    logger.info('Processing voice check-in', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // Get userId from authenticated user
    const userId = (req.user as { id: string })!.id;

    // Step 1: Transcribe audio
    logger.info('Starting transcription');
    const transcriptionResult = await transcribeAudio(audioFilePath);
    const rawTranscript = transcriptionResult.text;

    logger.info('Transcription completed', {
      transcriptLength: rawTranscript.length,
    });

    // Step 2: Parse symptoms from transcript
    logger.info('Starting symptom parsing');
    const parsed = await parseSymptoms(rawTranscript);

    logger.info('Symptom parsing completed', {
      symptomCount: Object.keys(parsed.symptoms).length,
      activityCount: parsed.activities.length,
      triggerCount: parsed.triggers.length,
    });

    // Step 3: Save to database
    const checkIn = new CheckIn({
      userId,
      timestamp: new Date(),
      rawTranscript,
      structured: {
        symptoms: parsed.symptoms,
        activities: parsed.activities,
        triggers: parsed.triggers,
        notes: parsed.notes,
      },
      flaggedForDoctor: false,
    });

    await checkIn.save();

    logger.info('Check-in saved successfully', {
      checkInId: checkIn._id,
    });

    // Step 4: Clean up audio file
    try {
      await fs.unlink(audioFilePath);
      logger.debug('Audio file cleaned up', { path: audioFilePath });
    } catch (cleanupError) {
      logger.warn('Failed to cleanup audio file', {
        path: audioFilePath,
        error: cleanupError,
      });
    }

    // Step 5: Return response
    res.status(201).json({
      success: true,
      data: {
        checkIn: {
          id: checkIn._id,
          timestamp: checkIn.timestamp,
          rawTranscript: checkIn.rawTranscript,
          structured: checkIn.structured,
        },
      },
    });
  } catch (error) {
    // Clean up audio file in case of error
    if (audioFilePath) {
      try {
        await fs.unlink(audioFilePath);
        logger.debug('Audio file cleaned up after error', {
          path: audioFilePath,
        });
      } catch (cleanupError) {
        logger.warn('Failed to cleanup audio file after error', {
          path: audioFilePath,
          error: cleanupError,
        });
      }
    }

    logger.error('Error creating voice check-in', { error });
    next(error);
  }
}

/**
 * GET /api/checkins
 * Retrieves check-ins for authenticated user with filtering, pagination, and sorting
 * Requires authentication - automatically filters by authenticated user's ID
 * Query params:
 * - startDate: filter by start date (ISO 8601)
 * - endDate: filter by end date (ISO 8601)
 * - symptom: filter by symptom name (can specify multiple)
 * - activity: filter by activity (can specify multiple)
 * - trigger: filter by trigger (can specify multiple)
 * - flaggedForDoctor: filter by flagged status (true/false)
 * - limit: max number of results (default 20, max 100)
 * - offset: number of results to skip (default 0)
 * - sortBy: field to sort by (timestamp, default)
 * - sortOrder: asc or desc (default desc)
 */
export async function getCheckins(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    logger.info('Fetching check-ins', { query: req.query });

    // Get userId from authenticated user
    const userId = (req.user as { id: string })!.id;

    // Build query filter
    interface QueryFilter {
      userId: string;
      timestamp?: {
        $gte?: Date;
        $lte?: Date;
      };
      'structured.symptoms'?: { $exists: boolean };
      'structured.activities'?: { $in: string[] };
      'structured.triggers'?: { $in: string[] };
      flaggedForDoctor?: boolean;
    }

    const filter: QueryFilter = { userId };

    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.timestamp.$lte = new Date(req.query.endDate as string);
      }
    }

    // Symptom filtering (check if symptom key exists in symptoms map)
    if (req.query.symptom) {
      const symptoms = Array.isArray(req.query.symptom) ? req.query.symptom : [req.query.symptom];
      // For now, we'll just check if any symptoms exist
      // Full text search on symptom names would require more complex querying
      if (symptoms.length > 0) {
        filter['structured.symptoms'] = { $exists: true };
      }
    }

    // Activity filtering
    if (req.query.activity) {
      const activities = Array.isArray(req.query.activity)
        ? (req.query.activity as string[])
        : [req.query.activity as string];
      filter['structured.activities'] = { $in: activities };
    }

    // Trigger filtering
    if (req.query.trigger) {
      const triggers = Array.isArray(req.query.trigger)
        ? (req.query.trigger as string[])
        : [req.query.trigger as string];
      filter['structured.triggers'] = { $in: triggers };
    }

    // Flagged for doctor filtering
    if (req.query.flaggedForDoctor !== undefined) {
      filter.flaggedForDoctor = req.query.flaggedForDoctor === 'true';
    }

    // Pagination
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'timestamp';
    const sortOrder: 'asc' | 'desc' = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    const sort: Record<string, 'asc' | 'desc'> = { [sortBy]: sortOrder };

    logger.info('Query parameters processed', {
      filter,
      limit,
      offset,
      sort,
    });

    // Execute query
    const [checkIns, total] = await Promise.all([
      CheckIn.find(filter).sort(sort).limit(limit).skip(offset).select('-__v').lean(),
      CheckIn.countDocuments(filter),
    ]);

    logger.info('Check-ins retrieved', {
      count: checkIns.length,
      total,
    });

    // Return response
    res.status(200).json({
      success: true,
      data: {
        checkIns,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + checkIns.length < total,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching check-ins', { error });
    next(error);
  }
}

/**
 * POST /api/checkins/manual
 * Accepts manually-entered structured check-in data
 */
export async function createManualCheckin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.info('Processing manual check-in');

    // Get userId from authenticated user
    const userId = (req.user as { id: string })!.id;

    // Validate structured data is provided
    if (!req.body.structured) {
      res.status(400).json({
        success: false,
        error: 'Structured check-in data is required',
      });
      return;
    }

    const { structured } = req.body;

    logger.info('Manual check-in data received', {
      symptomCount: Object.keys(structured.symptoms || {}).length,
      activityCount: (structured.activities || []).length,
      triggerCount: (structured.triggers || []).length,
    });

    // Save to database with rawTranscript set to 'manual entry'
    const checkIn = new CheckIn({
      userId,
      timestamp: new Date(),
      rawTranscript: 'manual entry',
      structured: {
        symptoms: structured.symptoms || {},
        activities: structured.activities || [],
        triggers: structured.triggers || [],
        notes: structured.notes || '',
      },
      flaggedForDoctor: false,
    });

    await checkIn.save();

    logger.info('Manual check-in saved successfully', {
      checkInId: checkIn._id,
    });

    // Return response
    res.status(201).json({
      success: true,
      data: {
        checkIn: {
          id: checkIn._id,
          timestamp: checkIn.timestamp,
          rawTranscript: checkIn.rawTranscript,
          structured: checkIn.structured,
        },
      },
    });
  } catch (error) {
    logger.error('Error creating manual check-in', { error });
    next(error);
  }
}

/**
 * GET /api/checkins/status
 * Returns daily check-in status based on user's notification schedule
 */
export async function getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get userId from authenticated user
    const userId = (req.user as { id: string })!.id;

    logger.info('Fetching check-in status', { userId });

    // Fetch user to get notification times
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Get today's date boundaries (start and end of day in UTC)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch today's check-ins
    const todayCheckIns = await CheckIn.find({
      userId,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ timestamp: 1 })
      .select('timestamp')
      .lean();

    logger.info("Today's check-ins retrieved", {
      userId,
      count: todayCheckIns.length,
    });

    // Format today's date
    const todayDate = now.toISOString().split('T')[0];

    // Get scheduled times from user profile
    const scheduledTimes = user.notificationTimes || [];

    // Map check-ins to time windows (within 2 hours)
    const completedLogs = todayCheckIns.map((checkIn) => {
      const timestamp = new Date(checkIn.timestamp);
      return {
        time: timestamp.toTimeString().slice(0, 5), // HH:MM format
        checkInId: checkIn._id.toString(),
      };
    });

    // Determine next suggested time
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    let nextSuggested: string | null = null;

    // Find the next scheduled time after current time
    for (const scheduledTime of scheduledTimes) {
      if (scheduledTime > currentTime) {
        nextSuggested = scheduledTime;
        break;
      }
    }

    // If all scheduled times have passed, suggest tomorrow's first time
    if (!nextSuggested && scheduledTimes.length > 0) {
      nextSuggested = scheduledTimes[0];
    }

    // Determine if user is complete for today
    // User is complete if they have at least as many logs as scheduled times
    // If no scheduled times, never mark as complete
    const isComplete = scheduledTimes.length > 0 && todayCheckIns.length >= scheduledTimes.length;

    logger.info('Check-in status calculated', {
      userId,
      todayCount: todayCheckIns.length,
      scheduledCount: scheduledTimes.length,
      isComplete,
      nextSuggested,
    });

    // Return response
    res.status(200).json({
      success: true,
      data: {
        today: {
          date: todayDate,
          scheduledTimes,
          completedLogs,
          nextSuggested,
          isComplete,
        },
        stats: {
          todayCount: todayCheckIns.length,
          scheduledCount: scheduledTimes.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching check-in status', { error });
    next(error);
  }
}
