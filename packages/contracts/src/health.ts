import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string().min(1),
  timestamp: z.iso.datetime(),
});

export const databaseHealthResponseSchema = healthResponseSchema.extend({
  database: z.literal('connected'),
});

export const databaseHealthErrorSchema = z.object({
  status: z.literal('unavailable'),
  service: z.string().min(1),
  database: z.literal('unavailable'),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type DatabaseHealthResponse = z.infer<
  typeof databaseHealthResponseSchema
>;
export type DatabaseHealthError = z.infer<
  typeof databaseHealthErrorSchema
>;
