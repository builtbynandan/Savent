import 'dotenv/config';

import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  CLIENT_URL: z.url().default('http://localhost:5173'),
  DATABASE_URL: z
    .url()
    .refine(
      (value) => value.startsWith('postgresql://'),
      'DATABASE_URL must use the postgresql:// protocol',
    ),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).optional(),
  METRICS_TOKEN: z.string().min(24).optional(),
  RELEASE_SHA: z.string().trim().min(1).max(128).default('development'),
  SESSION_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(
    `Invalid environment configuration:\n${z.prettifyError(result.error)}`,
  );
}

export const env = {
  ...result.data,
  LOG_LEVEL:
    result.data.LOG_LEVEL ??
    (result.data.NODE_ENV === 'test' ? ('silent' as const) : ('info' as const)),
  SESSION_COOKIE_SECURE:
    result.data.SESSION_COOKIE_SECURE ?? result.data.NODE_ENV === 'production',
};
