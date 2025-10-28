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
