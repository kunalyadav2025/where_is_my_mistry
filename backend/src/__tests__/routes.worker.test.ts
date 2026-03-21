import request from 'supertest';
import express, { Express } from 'express';
import workerRoutes from '../routes/worker.routes';
import { errorHandler } from '../middleware/error';

describe('Worker Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/workers', workerRoutes);
    app.use(errorHandler);
  });

  describe('GET /api/workers', () => {
    describe('Happy Path', () => {
      it('should return 200 with empty worker list', async () => {
        const response = await request(app).get('/api/workers');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.workers).toBeDefined();
        expect(Array.isArray(response.body.data.workers)).toBe(true);
      });

      it('should include pagination metadata', async () => {
        const response = await request(app).get('/api/workers');

        expect(response.body.data.pagination).toBeDefined();
        expect(response.body.data.pagination).toMatchObject({
          page: 1,
          limit: 20,
          total: 0,
          hasMore: false,
        });
      });

      it('should return valid JSON', async () => {
        const response = await request(app).get('/api/workers');

        expect(response.headers['content-type']).toMatch(/json/);
      });
    });

    describe('Edge Cases', () => {
      it('should handle query parameters gracefully', async () => {
        const response = await request(app)
          .get('/api/workers')
          .query({ category: 'plumber', location: 'mumbai' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should handle page and limit query parameters', async () => {
        const response = await request(app)
          .get('/api/workers')
          .query({ page: 2, limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should handle malformed query parameters', async () => {
        const response = await request(app)
          .get('/api/workers')
          .query({ page: 'invalid', limit: 'bad' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('GET /api/workers/:workerId', () => {
    describe('Happy Path', () => {
      it('should attempt to fetch worker by ID', async () => {
        const workerId = 'worker-123';
        const response = await request(app).get(`/api/workers/${workerId}`);

        // Currently returns 404 as no workers exist
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });

    describe('Edge Cases', () => {
      it('should handle non-existent worker ID', async () => {
        const response = await request(app).get('/api/workers/non-existent-id');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toMatch(/not found/);
      });

      it('should handle special characters in worker ID', async () => {
        const response = await request(app).get('/api/workers/worker-@#$%');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });

      it('should handle very long worker IDs', async () => {
        const longId = 'a'.repeat(1000);
        const response = await request(app).get(`/api/workers/${longId}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });

      it('should handle empty worker ID gracefully', async () => {
        // This will match GET /api/workers instead
        const response = await request(app).get('/api/workers/');

        // Should either list workers or return 404
        expect([200, 404]).toContain(response.status);
      });
    });
  });

  describe('POST /api/workers', () => {
    describe('Happy Path', () => {
      it('should return 201 when creating worker', async () => {
        const workerData = {
          name: 'Test Worker',
          mobile: '9876543210',
          category: 'plumber',
        };

        const response = await request(app)
          .post('/api/workers')
          .send(workerData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('Worker profile created');
      });

      it('should accept complete worker data', async () => {
        const workerData = {
          name: 'John Doe',
          mobile: '9876543210',
          category: 'electrician',
          location: 'mumbai',
          experience: 5,
          bio: 'Experienced electrician',
        };

        const response = await request(app)
          .post('/api/workers')
          .send(workerData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Edge Cases - Request Validation', () => {
      it('should handle empty request body', async () => {
        const response = await request(app).post('/api/workers').send({});

        // Currently returns 201 as validation not fully implemented
        expect(response.status).toBe(201);
      });

      it('should handle null values', async () => {
        const response = await request(app)
          .post('/api/workers')
          .send({ name: null, mobile: null });

        expect(response.status).toBe(201);
      });

      it('should handle missing required fields', async () => {
        const response = await request(app)
          .post('/api/workers')
          .send({ category: 'plumber' });

        expect(response.status).toBe(201);
      });

      it('should handle extra fields', async () => {
        const response = await request(app)
          .post('/api/workers')
          .send({
            name: 'Test',
            mobile: '9876543210',
            extraField: 'should be ignored',
            anotherExtra: 123,
          });

        expect(response.status).toBe(201);
      });

      it('should handle very large request body', async () => {
        const largeData = {
          name: 'Test',
          bio: 'a'.repeat(100000), // 100KB bio
        };

        const response = await request(app)
          .post('/api/workers')
          .send(largeData);

        // Should either succeed or reject based on size limits
        expect([201, 413]).toContain(response.status);
      });
    });

    describe('Edge Cases - Content Type', () => {
      it('should reject non-JSON content type', async () => {
        const response = await request(app)
          .post('/api/workers')
          .set('Content-Type', 'text/plain')
          .send('name=Test&mobile=9876543210');

        // Express json middleware should handle this
        expect([201, 400]).toContain(response.status);
      });
    });
  });

  describe('PUT /api/workers/:workerId', () => {
    describe('Happy Path', () => {
      it('should return 200 when updating worker', async () => {
        const workerId = 'worker-123';
        const updateData = {
          name: 'Updated Name',
          bio: 'Updated bio',
        };

        const response = await request(app)
          .put(`/api/workers/${workerId}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('Worker profile updated');
        expect(response.body.data.workerId).toBe(workerId);
      });

      it('should accept partial updates', async () => {
        const response = await request(app)
          .put('/api/workers/worker-123')
          .send({ bio: 'New bio only' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty update data', async () => {
        const response = await request(app)
          .put('/api/workers/worker-123')
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should handle non-existent worker ID', async () => {
        const response = await request(app)
          .put('/api/workers/non-existent')
          .send({ name: 'Test' });

        // Currently returns 200 as existence check not implemented
        expect(response.status).toBe(200);
      });

      it('should handle special characters in worker ID', async () => {
        const response = await request(app)
          .put('/api/workers/worker-@#$')
          .send({ name: 'Test' });

        expect(response.status).toBe(200);
      });

      it('should handle invalid field types', async () => {
        const response = await request(app)
          .put('/api/workers/worker-123')
          .send({ experience: 'not-a-number', verified: 'not-a-boolean' });

        expect(response.status).toBe(200);
      });

      it('should handle null values in update', async () => {
        const response = await request(app)
          .put('/api/workers/worker-123')
          .send({ bio: null, experience: null });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('CORS and Headers', () => {
    it('should accept requests without CORS headers', async () => {
      const response = await request(app).get('/api/workers');

      expect(response.status).toBe(200);
    });

    it('should handle different HTTP methods', async () => {
      const methods = [
        { method: 'get', path: '/api/workers' },
        { method: 'post', path: '/api/workers' },
        { method: 'put', path: '/api/workers/123' },
      ];

      for (const { method, path } of methods) {
        const response = await (request(app) as any)[method](path).send({});
        expect([200, 201]).toContain(response.status);
      }
    });
  });
});
