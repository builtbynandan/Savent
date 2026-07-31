import {
  databaseHealthErrorSchema,
  databaseHealthResponseSchema,
  healthResponseSchema,
} from '@savent/contracts';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { prisma } from './lib/prisma.js';

export const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json());

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

app.use((_request, response) => {
  response.status(404).json({
    error: 'Route not found',
  });
});
