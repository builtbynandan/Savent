import {
  apiErrorSchema,
  databaseHealthResponseSchema,
  healthResponseSchema,
} from '@savent/contracts';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('health endpoints', () => {
  it('reports that the API is running', async () => {
    const response = await request(app).get('/api/health/live').expect(200);

    expect(healthResponseSchema.parse(response.body)).toMatchObject({
      status: 'ok',
      service: 'savent-api',
    });
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('reports that PostgreSQL is connected', async () => {
    const response = await request(app).get('/api/health/ready').expect(200);

    expect(databaseHealthResponseSchema.parse(response.body)).toMatchObject({
      status: 'ok',
      database: 'connected',
    });
  });

  it('exports Prometheus-compatible request metrics', async () => {
    const response = await request(app).get('/api/metrics').expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('savent_http_requests_total');
    expect(response.text).toContain('savent_process_uptime_seconds');
  });

  it('propagates a safe upstream request identifier', async () => {
    const response = await request(app)
      .get('/api/health/live')
      .set('x-request-id', 'deployment-smoke-test')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('deployment-smoke-test');
  });
});

describe('error responses', () => {
  it('returns a structured error for unknown routes', async () => {
    const response = await request(app).get('/api/does-not-exist').expect(404);

    expect(apiErrorSchema.parse(response.body)).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route GET /api/does-not-exist was not found',
      },
    });
  });
});
