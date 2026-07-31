import { healthResponseSchema } from '@savent/contracts';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

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

app.use((_request, response) => {
  response.status(404).json({
    error: 'Route not found',
  });
});
