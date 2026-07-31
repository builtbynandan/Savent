import {
  databaseHealthErrorSchema,
  databaseHealthResponseSchema,
  healthResponseSchema,
} from '@savent/contracts';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

export const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  const health = healthResponseSchema.parse({
    status: 'ok',
    service: 'savent-api',
    timestamp: new Date().toISOString(),
  });

  response.status(200).json(health);
});

app.get('/api/health/database', async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const health = databaseHealthResponseSchema.parse({
      status: 'ok',
      service: 'savent-api',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });

    response.status(200).json(health);
  } catch {
    const health = databaseHealthErrorSchema.parse({
      status: 'unavailable',
      service: 'savent-api',
      database: 'unavailable',
      timestamp: new Date().toISOString(),
    });

    response.status(503).json(health);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);
