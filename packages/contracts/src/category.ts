import { z } from 'zod';

import { categoryKindSchema } from './transaction.js';

export const categoryIconSchema = z.enum([
  'wallet',
  'shopping-cart',
  'utensils',
  'train',
  'house',
  'heart',
  'film',
  'receipt',
  'graduation-cap',
  'gift',
  'tag',
]);

const categoryFields = {
  name: z.string().trim().min(1).max(80),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, 'Colour must be a 6-digit hex value'),
  icon: categoryIconSchema,
};

export const createCategorySchema = z.object({
  ...categoryFields,
  kind: categoryKindSchema,
});
export const updateCategorySchema = z.object(categoryFields);
export const categoryIdParamsSchema = z.object({ id: z.uuid() });
export const categoryArchiveSchema = z.object({ isArchived: z.boolean() });
export const categoryQuerySchema = z.object({
  includeArchived: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export const categorySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  kind: categoryKindSchema,
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  icon: categoryIconSchema,
  isSystem: z.boolean(),
  isArchived: z.boolean(),
  transactionCount: z.number().int().nonnegative(),
  budgetCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const categoryResponseSchema = z.object({ data: categorySchema });
export const categoriesResponseSchema = z.object({
  data: z.array(categorySchema),
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryIcon = z.infer<typeof categoryIconSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
