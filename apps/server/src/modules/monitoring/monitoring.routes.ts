import { timingSafeEqual } from 'node:crypto';

import {
  databaseHealthErrorSchema,
  databaseHealthResponseSchema,
  healthResponseSchema,
} from '@savent/contracts';
import { Router } from 'express';

import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { renderMetrics } from '../../lib/metrics.js';

export const monitoringRouter = Router();

function serviceHealth() {
  return healthResponseSchema.parse({
    status: 'ok',
    service: 'savent-api',
    release: env.RELEASE_SHA,
    timestamp: new Date().toISOString(),
  });
}

monitoringRouter.get(['/health', '/health/live'], (_request, response) => {
  response.status(200).json(serviceHealth());
});

monitoringRouter.get(
  ['/health/database', '/health/ready'],
  async (_request, response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.status(200).json(
        databaseHealthResponseSchema.parse({
          ...serviceHealth(),
          database: 'connected',
        }),
      );
    } catch {
      response.status(503).json(
        databaseHealthErrorSchema.parse({
          status: 'unavailable',
          service: 'savent-api',
          release: env.RELEASE_SHA,
          database: 'unavailable',
          timestamp: new Date().toISOString(),
        }),
      );
    }
  },
);

monitoringRouter.get('/metrics', (request, response) => {
  if (env.METRICS_TOKEN) {
    const provided = request
      .header('authorization')
      ?.replace(/^Bearer\s+/i, '');
    const expectedBuffer = Buffer.from(env.METRICS_TOKEN);
    const providedBuffer = Buffer.from(provided ?? '');
    const valid =
      expectedBuffer.length === providedBuffer.length &&
      timingSafeEqual(expectedBuffer, providedBuffer);
    if (!valid) {
      response.status(401).json({
        error: {
          code: 'METRICS_AUTHENTICATION_REQUIRED',
          message: 'Unauthorized',
        },
      });
      return;
    }
  }

  response
    .status(200)
    .type('text/plain; version=0.0.4; charset=utf-8')
    .send(renderMetrics());
});
