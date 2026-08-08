import { z } from 'zod';

import { accountTypeSchema } from './transaction.js';

const signedMoneyPattern = /^-?(0|[1-9]\d*)(\.\d{1,2})?$/;
const currencyPattern = /^[A-Z]{3}$/;

export const accountInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: accountTypeSchema,
  currency: z.literal('AUD', {
    error: 'Only AUD accounts are supported until currency conversion is added',
  }),
  openingBalance: z
    .string()
    .regex(
      signedMoneyPattern,
      'Opening balance must have no more than 2 decimal places',
    ),
});

export const createAccountSchema = accountInputSchema;
export const updateAccountSchema = accountInputSchema;
export const accountIdParamsSchema = z.object({ id: z.uuid() });
export const accountArchiveSchema = z.object({ isArchived: z.boolean() });
export const accountQuerySchema = z.object({
  includeArchived: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export const accountSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  type: accountTypeSchema,
  currency: z.string().regex(currencyPattern),
  openingBalance: z.string().regex(signedMoneyPattern),
  balance: z.string().regex(signedMoneyPattern),
  isArchived: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const accountResponseSchema = z.object({ data: accountSchema });
export const accountsResponseSchema = z.object({
  data: z.array(accountSchema),
});

export type Account = z.infer<typeof accountSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
