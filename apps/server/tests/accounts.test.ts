import {
  accountResponseSchema,
  accountsResponseSchema,
  transactionOptionsResponseSchema,
} from '@savent/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const authenticated = request.agent(app);
let createdAccountId: string | undefined;
let createdTransactionId: string | undefined;

beforeAll(async () => {
  await authenticated
    .post('/api/auth/login')
    .send({ email: 'demo@savent.app', password: 'Demo1234!' })
    .expect(200);
});

afterAll(async () => {
  if (createdTransactionId) {
    await prisma.transaction.deleteMany({
      where: { id: createdTransactionId },
    });
  }
  if (createdAccountId) {
    await prisma.account.deleteMany({ where: { id: createdAccountId } });
  }
  await prisma.$disconnect();
});

describe('account API', () => {
  it('requires authentication', async () => {
    await request(app).get('/api/accounts').expect(401);
  });

  it('creates, updates, balances, archives, and restores an account', async () => {
    const createResponse = await authenticated
      .post('/api/accounts')
      .send({
        name: 'Cycle 6 wallet',
        type: 'cash',
        currency: 'AUD',
        openingBalance: '100.00',
      })
      .expect(201);
    const created = accountResponseSchema.parse(createResponse.body).data;
    createdAccountId = created.id;
    expect(created.balance).toBe('100.00');

    const transactionResponse = await authenticated
      .post('/api/transactions')
      .send({
        type: 'income',
        description: 'Cycle 6 account balance test',
        amount: '25.00',
        currency: 'AUD',
        transactionDate: '2026-08-08T00:00:00.000Z',
        accountId: created.id,
        destinationAccountId: null,
        categoryId: null,
        notes: null,
      })
      .expect(201);
    createdTransactionId = transactionResponse.body.data.id as string;

    const accounts = accountsResponseSchema.parse(
      (await authenticated.get('/api/accounts').expect(200)).body,
    ).data;
    expect(accounts.find((account) => account.id === created.id)?.balance).toBe(
      '125.00',
    );

    const updated = accountResponseSchema.parse(
      (
        await authenticated
          .put(`/api/accounts/${created.id}`)
          .send({
            name: 'Cycle 6 spending wallet',
            type: 'cash',
            currency: 'AUD',
            openingBalance: '150.00',
          })
          .expect(200)
      ).body,
    ).data;
    expect(updated).toMatchObject({
      name: 'Cycle 6 spending wallet',
      balance: '175.00',
    });

    await authenticated
      .patch(`/api/accounts/${created.id}/archive`)
      .send({ isArchived: true })
      .expect(200);
    const options = transactionOptionsResponseSchema.parse(
      (await authenticated.get('/api/transactions/options').expect(200)).body,
    ).data;
    expect(options.accounts.some((account) => account.id === created.id)).toBe(
      false,
    );

    await authenticated
      .patch(`/api/accounts/${created.id}/archive`)
      .send({ isArchived: false })
      .expect(200);
  });

  it('rejects duplicate account names', async () => {
    const response = await authenticated
      .post('/api/accounts')
      .send({
        name: 'everyday',
        type: 'checking',
        currency: 'AUD',
        openingBalance: '0.00',
      })
      .expect(409);
    expect(response.body.error.code).toBe('ACCOUNT_NAME_EXISTS');
  });
});
