import { describe, expect, it } from 'vitest';

import {
  accountArchiveSchema,
  accountQuerySchema,
  createAccountSchema,
} from '../src/index.js';

describe('account contracts', () => {
  it('accepts a valid account with a negative opening balance', () => {
    expect(
      createAccountSchema.parse({
        name: 'Credit card',
        type: 'credit',
        currency: 'AUD',
        openingBalance: '-250.50',
      }),
    ).toMatchObject({ name: 'Credit card', openingBalance: '-250.50' });
  });

  it('rejects malformed balances and currencies', () => {
    expect(() =>
      createAccountSchema.parse({
        name: 'Everyday',
        type: 'checking',
        currency: 'aud',
        openingBalance: '10.999',
      }),
    ).toThrow();
  });

  it('parses account list and archive controls', () => {
    expect(accountQuerySchema.parse({ includeArchived: 'true' })).toEqual({
      includeArchived: true,
    });
    expect(accountArchiveSchema.parse({ isArchived: true })).toEqual({
      isArchived: true,
    });
  });
});
