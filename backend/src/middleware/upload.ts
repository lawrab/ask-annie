import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { logger } from '../utils/logger';
import { UPLOAD_CONSTANTS } from '../constants';

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    // Store in /tmp directory
    cb(null, '/tmp');
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `audio-${uniqueSuffix}${ext}`);
  },
});

// File filter to accept only audio files
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('audio/')) {
    logger.debug('Audio file accepted', {
      mimetype: file.mimetype,
      originalname: file.originalname,
    });
    cb(null, true);
  } else {
    logger.warn('Non-audio file rejected', {
      mimetype: file.mimetype,
      originalname: file.originalname,
    });
    cb(new Error('Only audio files are allowed'));
  }
};

// Create multer instance with configuration
export const audioUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONSTANTS.MAX_AUDIO_FILE_SIZE,
  },
});
