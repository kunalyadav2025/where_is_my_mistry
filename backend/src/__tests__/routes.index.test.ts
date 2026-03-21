import request from 'supertest';
import express, { Express } from 'express';
import routes from '../routes';
import { errorHandler } from '../middleware/error';

describe('Routes Index', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', routes);
    app.use(errorHandler);
  });

  describe('Route Registration', () => {
    it('should register health routes at /api/health', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should register auth routes at /api/auth', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: '9876543210' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should register worker routes at /api/workers', async () => {
      const response = await request(app).get('/api/workers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Route Organization', () => {
    it('should handle requests to all registered routes', async () => {
      const routes = [
        { method: 'get', path: '/api/health' },
        { method: 'post', path: '/api/auth/send-otp' },
        { method: 'post', path: '/api/auth/verify-otp' },
        { method: 'get', path: '/api/workers' },
        { method: 'post', path: '/api/workers' },
      ];

      for (const route of routes) {
        const response = await (request(app) as any)[route.method](route.path).send(
          route.method === 'post' ? { mobile: '9876543210', otp: '123456' } : {}
        );

        // Should not return 404
        expect(response.status).not.toBe(404);
      }
    });
  });
});
