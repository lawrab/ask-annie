import { Router } from 'express';
import { audioUpload } from '../middleware/upload';
import { validateRequest } from '../middleware/validateRequest';
import { createVoiceCheckin, createManualCheckin } from '../controllers/checkinController';
import { manualCheckinSchema } from '../utils/validation';

const router = Router();

/**
 * POST /api/checkins
 * Create a new check-in from voice recording
 * Accepts multipart/form-data with audio file
 */
router.post('/', audioUpload.single('audio'), createVoiceCheckin);

/**
 * POST /api/checkins/manual
 * Create a new check-in from manually-entered data
 * Accepts JSON with structured symptom data
 */
router.post('/manual', validateRequest(manualCheckinSchema), createManualCheckin);

export default router;
