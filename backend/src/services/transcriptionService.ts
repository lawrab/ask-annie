import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { createReadStream, promises as fsPromises } from 'fs';
import OpenAI from 'openai';
import { logger } from '../utils/logger';

const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:8000/v1/audio/transcriptions';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'Systran/faster-distil-whisper-small.en';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI client if API key is provided
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * Transcription service response interface
 */
export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

/**
 * Transcribe an audio file using OpenAI Whisper API (production) or faster-whisper-server (local dev)
 * @param audioFilePath Path to the audio file to transcribe
 * @param language Optional language code (e.g., 'en', 'es')
 * @returns Transcription result with text
 */
export async function transcribeAudio(
  audioFilePath: string,
  language?: string
): Promise<TranscriptionResult> {
  // Verify file exists
  await fsPromises.access(audioFilePath, fs.constants.R_OK);
  const fileStats = await fsPromises.stat(audioFilePath);

  // Use OpenAI Whisper API if API key is configured (production)
  if (openai) {
    return transcribeWithOpenAI(audioFilePath, fileStats.size, language);
  }

  // Fall back to local faster-whisper-server (development)
  return transcribeWithFasterWhisper(audioFilePath, fileStats.size, language);
}

/**
 * Transcribe using OpenAI Whisper API (for production/Railway)
 */
async function transcribeWithOpenAI(
  audioFilePath: string,
  fileSize: number,
  language?: string
): Promise<TranscriptionResult> {
  try {
    logger.info('Transcribing with OpenAI Whisper API', {
      path: audioFilePath,
      size: fileSize,
      language,
    });

    const transcription = await openai!.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: language,
      response_format: 'verbose_json',
    });

    logger.info('OpenAI transcription completed', {
      textLength: transcription.text?.length || 0,
      duration: transcription.duration,
    });

    return {
      text: transcription.text || '',
      language: transcription.language,
      duration: transcription.duration,
    };
  } catch (error) {
    logger.error('OpenAI Whisper API error', { error });
    throw new Error(`OpenAI transcription failed: ${error}`);
  }
}

/**
 * Transcribe using local faster-whisper-server (for development)
 */
async function transcribeWithFasterWhisper(
  audioFilePath: string,
  fileSize: number,
  language?: string
): Promise<TranscriptionResult> {
  try {
    logger.info('Transcribing with faster-whisper-server', {
      path: audioFilePath,
      size: fileSize,
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

    logger.info('faster-whisper transcription completed', {
      textLength: response.data.text?.length || 0,
    });

    return {
      text: response.data.text || '',
      language: response.data.language,
      duration: response.data.duration,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error('faster-whisper API error', {
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
  // If using OpenAI API, check if API key is configured
  if (openai) {
    logger.info('Using OpenAI Whisper API (health check: API key configured)');
    return true; // OpenAI API is always available if key is configured
  }

  // Otherwise check faster-whisper-server health
  try {
    const healthUrl = WHISPER_URL.replace('/v1/audio/transcriptions', '/health');
    const response = await axios.get(healthUrl, { timeout: 5000 });
    logger.info('faster-whisper-server health check passed');
    return response.status === 200;
  } catch (error) {
    logger.warn('faster-whisper-server health check failed', { error });
    return false;
  }
}
