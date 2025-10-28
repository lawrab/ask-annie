import { Request, Response, NextFunction } from 'express';
import CheckIn from '../models/CheckIn';
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

    // TODO: Get userId from authenticated user session
    // For now, using a placeholder - will be replaced with actual auth
    const userId = req.body.userId || '000000000000000000000000';

    // Step 1: Transcribe audio
    logger.info('Starting transcription');
    const transcriptionResult = await transcribeAudio(audioFilePath);
    const rawTranscript = transcriptionResult.text;

    logger.info('Transcription completed', {
      transcriptLength: rawTranscript.length,
    });

    // Step 2: Parse symptoms from transcript
    logger.info('Starting symptom parsing');
    const parsed = parseSymptoms(rawTranscript);

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
        id: checkIn._id,
        timestamp: checkIn.timestamp,
        rawTranscript: checkIn.rawTranscript,
        structured: checkIn.structured,
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
 * Retrieves check-ins with filtering, pagination, and sorting
 * Query params:
 * - userId: filter by user (required for now until auth is implemented)
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

    // TODO: Get userId from authenticated user session
    // For now, require it as query parameter
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId query parameter is required',
      });
      return;
    }

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

    // TODO: Get userId from authenticated user session
    // For now, using a placeholder - will be replaced with actual auth
    const userId = req.body.userId || '000000000000000000000000';

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
        id: checkIn._id,
        timestamp: checkIn.timestamp,
        rawTranscript: checkIn.rawTranscript,
        structured: checkIn.structured,
      },
    });
  } catch (error) {
    logger.error('Error creating manual check-in', { error });
    next(error);
  }
}
