import {
  apiErrorSchema,
  transactionOptionsResponseSchema,
  transactionResponseSchema,
  transactionsResponseSchema,
} from '@savent/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const createdTransactionIds: string[] = [];
const authenticated = request.agent(app);

beforeAll(async () => {
  await authenticated
    .post('/api/auth/login')
    .send({ email: 'demo@savent.app', password: 'Demo1234!' })
    .expect(200);
});

afterAll(async () => {
  if (createdTransactionIds.length > 0) {
    await prisma.transaction.deleteMany({
      where: { id: { in: createdTransactionIds } },
    });
  }

  await prisma.$disconnect();
});

describe('transaction API', () => {
  it('lists seeded transactions and form options', async () => {
    const transactionsResponse = await authenticated
      .get('/api/transactions')
      .expect(200);
    const optionsResponse = await authenticated
      .get('/api/transactions/options')
      .expect(200);

    const transactions = transactionsResponseSchema.parse(
      transactionsResponse.body,
    );
    const options = transactionOptionsResponseSchema.parse(
      optionsResponse.body,
    );

    expect(transactions.data.length).toBeGreaterThanOrEqual(3);
    expect(options.data.accounts.length).toBeGreaterThanOrEqual(2);
    expect(options.data.categories.length).toBeGreaterThanOrEqual(5);
  });

  it('creates an expense and returns it in the transaction list', async () => {
    const optionsResponse = await authenticated
      .get('/api/transactions/options')
      .expect(200);
    const options = transactionOptionsResponseSchema.parse(
      optionsResponse.body,
    ).data;
    const account = options.accounts[0];
    const category = options.categories.find(
      (candidate) => candidate.kind === 'expense',
    );

    expect(account).toBeDefined();
    expect(category).toBeDefined();

    const createResponse = await authenticated
      .post('/api/transactions')
      .send({
        type: 'expense',
        description: 'Cycle 1 API test',
        amount: '24.50',
        currency: account?.currency,
        transactionDate: '2026-07-31T10:00:00.000Z',
        accountId: account?.id,
        destinationAccountId: null,
        categoryId: category?.id,
        notes: 'Removed automatically after the test',
      })
      .expect(201);
    const created = transactionResponseSchema.parse(createResponse.body).data;
    createdTransactionIds.push(created.id);

    expect(created).toMatchObject({
      description: 'Cycle 1 API test',
      amount: '24.50',
      type: 'expense',
    });

    const listResponse = await authenticated
      .get('/api/transactions')
      .expect(200);
    const listed = transactionsResponseSchema.parse(listResponse.body).data;

    expect(listed.some((transaction) => transaction.id === created.id)).toBe(
      true,
    );
  });

  it('rejects an invalid amount with a structured error', async () => {
    const response = await authenticated
      .post('/api/transactions')
      .send({
        type: 'expense',
        description: 'Invalid expense',
        amount: '0',
        currency: 'AUD',
        transactionDate: '2026-07-31T10:00:00.000Z',
        accountId: 'a26f6ef8-2ed7-4f53-8236-11643b97f0c4',
        destinationAccountId: null,
        categoryId: null,
      })
      .expect(400);

    expect(apiErrorSchema.parse(response.body).error.code).toBe(
      'VALIDATION_ERROR',
    );
  });

  it('searches, filters, sorts, and paginates transaction history', async () => {
    const response = await authenticated
      .get('/api/transactions')
      .query({
        search: 'salary',
        type: 'income',
        sort: 'amount_desc',
        page: 1,
        pageSize: 1,
      })
      .expect(200);
    const result = transactionsResponseSchema.parse(response.body);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.description.toLowerCase()).toContain('salary');
    expect(result.pagination).toMatchObject({
      page: 1,
      pageSize: 1,
    });
    expect(result.pagination.totalItems).toBeGreaterThanOrEqual(1);
    expect(Number(result.summary.income)).toBeGreaterThanOrEqual(3214);
    expect(result.summary.expenses).toBe('0.00');
  });

  it('returns details, updates, and deletes a transaction', async () => {
    const optionsResponse = await authenticated
      .get('/api/transactions/options')
      .expect(200);
    const options = transactionOptionsResponseSchema.parse(
      optionsResponse.body,
    ).data;
    const account = options.accounts[0];
    const category = options.categories.find(
      (candidate) => candidate.kind === 'expense',
    );

    const createResponse = await authenticated
      .post('/api/transactions')
      .send({
        type: 'expense',
        description: 'Cycle 2 lifecycle test',
        amount: '12.00',
        currency: account?.currency,
        transactionDate: '2026-08-01T10:00:00.000Z',
        accountId: account?.id,
        destinationAccountId: null,
        categoryId: category?.id,
        notes: null,
      })
      .expect(201);
    const created = transactionResponseSchema.parse(createResponse.body).data;
    createdTransactionIds.push(created.id);

    const detailsResponse = await authenticated
      .get(`/api/transactions/${created.id}`)
      .expect(200);
    expect(transactionResponseSchema.parse(detailsResponse.body).data.id).toBe(
      created.id,
    );

    const updateResponse = await authenticated
      .put(`/api/transactions/${created.id}`)
      .send({
        type: 'expense',
        description: 'Updated lifecycle test',
        amount: '18.75',
        currency: account?.currency,
        transactionDate: '2026-08-02T10:00:00.000Z',
        accountId: account?.id,
        destinationAccountId: null,
        categoryId: category?.id,
        notes: 'Edited in Cycle 2',
      })
      .expect(200);
    expect(
      transactionResponseSchema.parse(updateResponse.body).data,
    ).toMatchObject({
      description: 'Updated lifecycle test',
      amount: '18.75',
    });

    await authenticated.delete(`/api/transactions/${created.id}`).expect(200);
    await authenticated.get(`/api/transactions/${created.id}`).expect(404);
  });
});
