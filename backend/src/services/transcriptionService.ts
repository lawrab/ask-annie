import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { createReadStream, promises as fsPromises } from 'fs';
import { logger } from '../utils/logger';

const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:8000/v1/audio/transcriptions';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'Systran/faster-distil-whisper-small.en';

/**
 * Transcription service response interface
 */
export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

/**
 * Transcribe an audio file using faster-whisper-server
 * @param audioFilePath Path to the audio file to transcribe
 * @param language Optional language code (e.g., 'en', 'es')
 * @returns Transcription result with text
 */
export async function transcribeAudio(
  audioFilePath: string,
  language?: string
): Promise<TranscriptionResult> {
  try {
    // Verify file exists
    await fsPromises.access(audioFilePath, fs.constants.R_OK);

    const fileStats = await fsPromises.stat(audioFilePath);
    logger.info('Transcribing audio file', {
      path: audioFilePath,
      size: fileStats.size,
      language,
    });

    // Create form data with audio file
    const formData = new FormData();
    formData.append('file', createReadStream(audioFilePath), {
      filename: path.basename(audioFilePath),
    });
    formData.append('model', WHISPER_MODEL);

    if (language) {
      formData.append('language', language);
    }

    // Call faster-whisper-server API
    const response = await axios.post(WHISPER_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // 60 second timeout
    });

    logger.info('Transcription completed', {
      textLength: response.data.text?.length || 0,
    });

    return {
      text: response.data.text || '',
      language: response.data.language,
      duration: response.data.duration,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error('Whisper API error', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(`Transcription failed: ${error.response?.data?.error || error.message}`);
    }

    logger.error('Transcription error', { error });
    throw new Error('Failed to transcribe audio file');
  }
}

/**
 * Clean up temporary audio file
 * @param audioFilePath Path to the temporary audio file
 */
export async function cleanupAudioFile(audioFilePath: string): Promise<void> {
  try {
    await fsPromises.unlink(audioFilePath);
    logger.info('Cleaned up audio file', { path: audioFilePath });
  } catch (error) {
    logger.warn('Failed to clean up audio file', {
      path: audioFilePath,
      error,
    });
  }
}

/**
 * Check if Whisper service is available
 * @returns true if service is healthy
 */
export async function checkWhisperHealth(): Promise<boolean> {
  try {
    const healthUrl = WHISPER_URL.replace('/v1/audio/transcriptions', '/health');
    const response = await axios.get(healthUrl, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    logger.warn('Whisper service health check failed', { error });
    return false;
  }
}
