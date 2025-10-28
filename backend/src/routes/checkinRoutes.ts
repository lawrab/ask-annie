import { Router } from 'express';
import { audioUpload } from '../middleware/upload';
import { createVoiceCheckin } from '../controllers/checkinController';

const router = Router();

/**
 * POST /api/checkins
 * Create a new check-in from voice recording
 * Accepts multipart/form-data with audio file
 */
router.post('/', audioUpload.single('audio'), createVoiceCheckin);

export default router;
