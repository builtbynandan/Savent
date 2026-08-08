import { z } from 'zod';

const emailSchema = z
  .email('Enter a valid email address')
  .max(320)
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or fewer');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const authUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
});

export const authResponseSchema = z.object({
  data: z.object({ user: authUserSchema }),
});

export const logoutResponseSchema = z.object({
  data: z.object({ success: z.literal(true) }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
