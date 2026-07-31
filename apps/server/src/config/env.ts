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
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(
    `Invalid environment configuration:\n${z.prettifyError(result.error)}`,
  );
}

export const env = result.data;
