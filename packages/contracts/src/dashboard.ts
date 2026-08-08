import { z } from 'zod';

const moneyPattern = /^\d+(\.\d{1,2})?$/;

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must use YYYY-MM');

export const dashboardQuerySchema = z.object({
  month: monthSchema.optional(),
});

export const budgetIdParamsSchema = z.object({ id: z.uuid() });

export const budgetInputSchema = z.object({
  categoryId: z.uuid(),
  month: monthSchema,
  amount: z
    .string()
    .regex(moneyPattern, 'Use a positive amount with up to two decimal places')
    .refine((value) => Number(value) > 0, 'Budget amount must be positive'),
});

export const budgetProgressSchema = z.object({
  id: z.uuid(),
  category: z.object({
    id: z.uuid(),
    name: z.string(),
    color: z.string().nullable(),
    isArchived: z.boolean(),
  }),
  month: monthSchema,
  amount: z.string().regex(moneyPattern),
  spent: z.string().regex(moneyPattern),
  remaining: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  percentage: z.number().nonnegative(),
  status: z.enum(['on_track', 'near_limit', 'over_budget']),
});

const reportMonthSchema = z.object({
  month: monthSchema,
  label: z.string(),
  income: z.string().regex(moneyPattern),
  expenses: z.string().regex(moneyPattern),
});

const categorySpendingSchema = z.object({
  categoryId: z.uuid().nullable(),
  name: z.string(),
  color: z.string(),
  amount: z.string().regex(moneyPattern),
  percentage: z.number().min(0).max(100),
});

export const dashboardResponseSchema = z.object({
  data: z.object({
    month: monthSchema,
    summary: z.object({
      balance: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
      income: z.string().regex(moneyPattern),
      expenses: z.string().regex(moneyPattern),
      savings: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
      savingsRate: z.number(),
      transactionCount: z.number().int().nonnegative(),
    }),
    budgets: z.object({
      allocated: z.string().regex(moneyPattern),
      spent: z.string().regex(moneyPattern),
      remaining: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
      items: z.array(budgetProgressSchema),
    }),
    report: z.object({
      monthly: z.array(reportMonthSchema),
      categories: z.array(categorySpendingSchema),
    }),
  }),
});

export const budgetResponseSchema = z.object({
  data: budgetProgressSchema,
});

export const deleteBudgetResponseSchema = z.object({
  data: z.object({ id: z.uuid() }),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type BudgetProgress = z.infer<typeof budgetProgressSchema>;
