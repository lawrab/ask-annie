import { Router } from 'express';

const router = Router();

// Health check for API
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// TODO: Add route modules as they are created
// router.use('/auth', authRoutes);
// router.use('/checkins', checkinRoutes);
// router.use('/analysis', analysisRoutes);
// router.use('/user', userRoutes);

export default router;
