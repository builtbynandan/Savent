import { describe, expect, it } from 'vitest';

import {
  apiErrorSchema,
  databaseHealthResponseSchema,
  healthResponseSchema,
} from '../src/index.js';

describe('health contracts', () => {
  it('accepts a valid API health response', () => {
    expect(
      healthResponseSchema.parse({
        status: 'ok',
        service: 'savent-api',
        timestamp: '2026-07-31T00:00:00.000Z',
      }),
    ).toMatchObject({ status: 'ok', service: 'savent-api' });
  });

  it('accepts a connected database response', () => {
    expect(
      databaseHealthResponseSchema.parse({
        status: 'ok',
        service: 'savent-api',
        database: 'connected',
        timestamp: '2026-07-31T00:00:00.000Z',
      }),
    ).toMatchObject({ database: 'connected' });
  });

  it('accepts a structured API error', () => {
    expect(
      apiErrorSchema.parse({
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      }),
    ).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });
});
