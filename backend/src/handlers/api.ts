import express, { Express } from 'express';
import serverless from 'serverless-http';
import routes from '../routes';
import { errorHandler } from '../middleware/error';
import { validateEnv } from '../utils/validateEnv';
import { logger } from '../utils/logger';

// Validate environment variables at module load time
// This will fail the Lambda cold start if required variables are missing
try {
  validateEnv();
  logger.info('Environment validation passed');
} catch (error) {
  logger.error('Environment validation failed', error as Error);
  throw error; // Re-throw to fail Lambda initialization
}

const app: Express = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
});

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

export const handler = serverless(app);
