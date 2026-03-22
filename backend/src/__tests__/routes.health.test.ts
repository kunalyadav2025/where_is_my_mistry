import request from 'supertest';
import express, { Express } from 'express';
import healthRoutes from '../routes/health.routes';
import { errorHandler } from '../middleware/error';

describe('Health Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/health', healthRoutes);
    app.use(errorHandler);
  });

  describe('GET /api/health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          version: '1.0.0',
        },
      });
    });

    it('should include timestamp in response', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.data.timestamp).toBeDefined();
      const timestamp = new Date(response.body.data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should include environment in response', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.data.environment).toBeDefined();
      expect(typeof response.body.data.environment).toBe('string');
    });

    it('should return valid JSON', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should have consistent response structure', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.success).toBe(true);
    });

    it('should respond quickly', async () => {
      const startTime = Date.now();
      await request(app).get('/api/health');
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(100); // Should respond in less than 100ms
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(app).get('/api/health'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
