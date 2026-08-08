import { describe, expect, it } from 'vitest';

import { budgetInputSchema, dashboardQuerySchema } from '../src/index.js';

describe('dashboard contracts', () => {
  it('accepts a valid monthly budget', () => {
    expect(
      budgetInputSchema.parse({
        categoryId: '2ef02cc8-ecc3-4b35-a1f7-c66aad633b62',
        month: '2026-08',
        amount: '450.00',
      }),
    ).toMatchObject({ month: '2026-08', amount: '450.00' });
  });

  it('rejects invalid months and zero budgets', () => {
    expect(() => dashboardQuerySchema.parse({ month: '2026-13' })).toThrow();
    expect(() =>
      budgetInputSchema.parse({
        categoryId: '2ef02cc8-ecc3-4b35-a1f7-c66aad633b62',
        month: '2026-08',
        amount: '0',
      }),
    ).toThrow();
  });
});
