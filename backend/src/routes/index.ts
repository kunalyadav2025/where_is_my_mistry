import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import workerRoutes from './worker.routes';

const router = Router();

// Health check
router.use('/health', healthRoutes);

// Auth routes
router.use('/auth', authRoutes);

// Worker routes
router.use('/workers', workerRoutes);

export default router;
