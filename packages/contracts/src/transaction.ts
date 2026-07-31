import { z } from 'zod';

const moneyPattern = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
const currencyPattern = /^[A-Z]{3}$/;

export const transactionTypeSchema = z.enum(['income', 'expense', 'transfer']);

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  description: z.string().trim().min(1).max(120),
  amount: z
    .string()
    .regex(
      moneyPattern,
      'Amount must be a positive decimal with up to 2 places',
    ),
  currency: z
    .string()
    .regex(currencyPattern, 'Currency must be a 3-letter uppercase code'),
  transactionDate: z.iso.datetime(),
  accountId: z.uuid(),
  destinationAccountId: z.uuid().nullable().optional(),
  categoryId: z.uuid().nullable(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema
  .omit({
    accountId: true,
  })
  .partial()
  .extend({
    accountId: z.uuid().optional(),
  });

export const transactionSchema = createTransactionSchema.extend({
  id: z.uuid(),
  userId: z.uuid(),
  destinationAccountId: z.uuid().nullable(),
  notes: z.string().trim().max(500).nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
