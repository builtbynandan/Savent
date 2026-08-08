import { describe, expect, it } from 'vitest';

import {
  categoryArchiveSchema,
  categoryQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from '../src/index.js';

describe('category contracts', () => {
  it('accepts a custom category', () => {
    expect(
      createCategorySchema.parse({
        name: 'Health',
        kind: 'expense',
        color: '#0EA5E9',
        icon: 'heart',
      }),
    ).toMatchObject({ name: 'Health', kind: 'expense' });
  });

  it('rejects invalid colours and icons', () => {
    expect(() =>
      updateCategorySchema.parse({
        name: 'Health',
        color: 'blue',
        icon: 'unknown',
      }),
    ).toThrow();
  });

  it('parses archive and list controls', () => {
    expect(categoryQuerySchema.parse({ includeArchived: 'true' })).toEqual({
      includeArchived: true,
    });
    expect(categoryArchiveSchema.parse({ isArchived: false })).toEqual({
      isArchived: false,
    });
  });
});
