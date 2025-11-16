import { Router } from 'express';
import authRoutes from './authRoutes';
import checkinRoutes from './checkinRoutes';

const router = Router();

// Health check for API
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Route modules
router.use('/auth', authRoutes);
router.use('/checkins', checkinRoutes);

// TODO: Add remaining route modules as they are created
// router.use('/analysis', analysisRoutes);
// router.use('/user', userRoutes);

export default router;
