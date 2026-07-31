import { z } from 'zod';

const moneyPattern = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
const currencyPattern = /^[A-Z]{3}$/;

export const transactionTypeSchema = z.enum(['income', 'expense', 'transfer']);
export const accountTypeSchema = z.enum([
  'cash',
  'checking',
  'savings',
  'credit',
  'investment',
  'other',
]);
export const categoryKindSchema = z.enum(['income', 'expense']);

const transactionInputSchema = z.object({
  type: transactionTypeSchema,
  description: z.string().trim().min(1).max(120),
  amount: z
    .string()
    .regex(
      moneyPattern,
      'Amount must be a positive decimal with up to 2 places',
    )
    .refine((amount) => Number(amount) > 0, 'Amount must be greater than 0'),
  currency: z
    .string()
    .regex(currencyPattern, 'Currency must be a 3-letter uppercase code'),
  transactionDate: z.iso.datetime(),
  accountId: z.uuid(),
  destinationAccountId: z.uuid().nullable().optional(),
  categoryId: z.uuid().nullable(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const createTransactionSchema = transactionInputSchema.superRefine(
  (transaction, context) => {
    if (transaction.type === 'transfer' && !transaction.destinationAccountId) {
      context.addIssue({
        code: 'custom',
        path: ['destinationAccountId'],
        message: 'A transfer requires a destination account',
      });
    }

    if (
      transaction.type === 'transfer' &&
      transaction.accountId === transaction.destinationAccountId
    ) {
      context.addIssue({
        code: 'custom',
        path: ['destinationAccountId'],
        message: 'Source and destination accounts must be different',
      });
    }

    if (transaction.type !== 'transfer' && transaction.destinationAccountId) {
      context.addIssue({
        code: 'custom',
        path: ['destinationAccountId'],
        message: 'Only transfers may have a destination account',
      });
    }
  },
);

export const updateTransactionSchema = transactionInputSchema.partial();

export const accountSummarySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  type: accountTypeSchema,
  currency: z.string().regex(currencyPattern),
});

export const categorySummarySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  kind: categoryKindSchema,
  color: z.string().nullable(),
  icon: z.string().nullable(),
});

export const transactionSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  type: transactionTypeSchema,
  description: z.string().min(1),
  amount: z.string().regex(moneyPattern),
  currency: z.string().regex(currencyPattern),
  transactionDate: z.iso.datetime(),
  accountId: z.uuid(),
  destinationAccountId: z.uuid().nullable(),
  categoryId: z.uuid().nullable(),
  notes: z.string().trim().max(500).nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  account: accountSummarySchema,
  destinationAccount: accountSummarySchema.nullable(),
  category: categorySummarySchema.nullable(),
});

export const transactionResponseSchema = z.object({
  data: transactionSchema,
});

export const transactionsResponseSchema = z.object({
  data: z.array(transactionSchema),
});

export const transactionOptionsResponseSchema = z.object({
  data: z.object({
    accounts: z.array(accountSummarySchema),
    categories: z.array(categorySummarySchema),
  }),
});

export type AccountType = z.infer<typeof accountTypeSchema>;
export type AccountSummary = z.infer<typeof accountSummarySchema>;
export type CategoryKind = z.infer<typeof categoryKindSchema>;
export type CategorySummary = z.infer<typeof categorySummarySchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>;
export type TransactionOptionsResponse = z.infer<
  typeof transactionOptionsResponseSchema
>;
