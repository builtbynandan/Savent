import { describe, expect, it } from 'vitest';

import {
  createTransactionSchema,
  transactionQuerySchema,
  updateTransactionSchema,
} from '../src/index.js';

const transaction = {
  type: 'expense',
  description: 'Groceries',
  amount: '42.50',
  currency: 'AUD',
  transactionDate: '2026-07-31T10:00:00.000Z',
  accountId: 'a26f6ef8-2ed7-4f53-8236-11643b97f0c4',
  categoryId: '6680575a-f74e-495c-a39d-2f56a389df9e',
};

describe('transaction contracts', () => {
  it('accepts a valid expense', () => {
    expect(createTransactionSchema.parse(transaction)).toMatchObject({
      amount: '42.50',
      currency: 'AUD',
      type: 'expense',
    });
  });

  it('rejects amounts with more than two decimal places', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...transaction,
        amount: '42.999',
      }),
    ).toThrow();
  });

  it('rejects zero-value transactions', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...transaction,
        amount: '0',
      }),
    ).toThrow();
  });

  it('rejects lowercase currency codes', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...transaction,
        currency: 'aud',
      }),
    ).toThrow();
  });

  it('requires a destination account for transfers', () => {
    expect(() =>
      createTransactionSchema.parse({
        ...transaction,
        type: 'transfer',
        categoryId: null,
      }),
    ).toThrow();
  });

  it('adds safe pagination and sorting defaults', () => {
    expect(transactionQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 10,
      search: '',
      sort: 'date_desc',
    });
  });

  it('rejects an inverted date range', () => {
    expect(() =>
      transactionQuerySchema.parse({
        dateFrom: '2026-08-10',
        dateTo: '2026-08-01',
      }),
    ).toThrow();
  });

  it('validates complete transaction updates', () => {
    expect(updateTransactionSchema.parse(transaction)).toMatchObject({
      description: 'Groceries',
    });
    expect(() => updateTransactionSchema.parse({ amount: '10.00' })).toThrow();
  });
});
