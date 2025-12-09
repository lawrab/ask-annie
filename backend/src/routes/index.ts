import { Router } from 'express';
import authRoutes from './authRoutes';
import checkinRoutes from './checkinRoutes';
import analysisRoutes from './analysisRoutes';
import userRoutes from './userRoutes';
import reportingRoutes from './reportingRoutes';

const router = Router();

// Health check for API
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Route modules
router.use('/auth', authRoutes);
router.use('/checkins', checkinRoutes);
router.use('/analysis', analysisRoutes);
router.use('/user', userRoutes);
router.use('/reporting', reportingRoutes);

export default router;
