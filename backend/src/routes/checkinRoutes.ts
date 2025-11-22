import { Router } from 'express';
import { audioUpload } from '../middleware/upload';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth';
import {
  createVoiceCheckin,
  createManualCheckin,
  getCheckins,
  getStatus,
} from '../controllers/checkinController';
import { manualCheckinSchema } from '../utils/validation';

const router = Router();

/**
 * GET /api/checkins
 * Retrieve check-ins with filtering, pagination, and sorting
 * Requires authentication - returns only authenticated user's check-ins
 * Query params: startDate, endDate, symptom, activity, trigger,
 * flaggedForDoctor, limit, offset, sortBy, sortOrder
 */
router.get('/', authenticate, getCheckins);

/**
 * GET /api/checkins/status
 * Get daily check-in status based on user's notification schedule
 * Requires authentication - returns authenticated user's status
 */
router.get('/status', authenticate, getStatus);

/**
 * POST /api/checkins
 * Create a new check-in from voice recording
 * Requires authentication - creates check-in for authenticated user
 * Accepts multipart/form-data with audio file
 */
router.post('/', authenticate, audioUpload.single('audio'), createVoiceCheckin);

/**
 * POST /api/checkins/manual
 * Create a new check-in from manually-entered data
 * Requires authentication - creates check-in for authenticated user
 * Accepts JSON with structured symptom data
 */
router.post('/manual', authenticate, validateRequest(manualCheckinSchema), createManualCheckin);

export default router;
