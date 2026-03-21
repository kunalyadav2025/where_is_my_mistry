import { Router, Request, Response } from 'express';
import { successResponse } from '../utils/response';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  return successResponse(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
