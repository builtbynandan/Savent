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
    const response = await request(app).get('/api/health').expect(200);

    expect(healthResponseSchema.parse(response.body)).toMatchObject({
      status: 'ok',
      service: 'savent-api',
    });
  });

  it('reports that PostgreSQL is connected', async () => {
    const response = await request(app).get('/api/health/database').expect(200);

    expect(databaseHealthResponseSchema.parse(response.body)).toMatchObject({
      status: 'ok',
      database: 'connected',
    });
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
