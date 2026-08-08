import {
  categoriesResponseSchema,
  categoryResponseSchema,
  dashboardResponseSchema,
  transactionOptionsResponseSchema,
} from '@savent/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const authenticated = request.agent(app);
let createdCategoryId: string | undefined;
let createdTransactionId: string | undefined;
let createdBudgetId: string | undefined;

beforeAll(async () => {
  await authenticated
    .post('/api/auth/login')
    .send({ email: 'demo@savent.app', password: 'Demo1234!' })
    .expect(200);
});

afterAll(async () => {
  if (createdBudgetId) {
    await prisma.budget.deleteMany({ where: { id: createdBudgetId } });
  }
  if (createdTransactionId) {
    await prisma.transaction.deleteMany({
      where: { id: createdTransactionId },
    });
  }
  if (createdCategoryId) {
    await prisma.category.deleteMany({ where: { id: createdCategoryId } });
  }
  await prisma.$disconnect();
});

describe('category API', () => {
  it('requires authentication', async () => {
    await request(app).get('/api/categories').expect(401);
  });

  it('creates, edits, counts, archives, and restores a custom category', async () => {
    const created = categoryResponseSchema.parse(
      (
        await authenticated
          .post('/api/categories')
          .send({
            name: 'Cycle 7 health',
            kind: 'expense',
            color: '#0EA5E9',
            icon: 'heart',
          })
          .expect(201)
      ).body,
    ).data;
    createdCategoryId = created.id;
    expect(created).toMatchObject({ isSystem: false, transactionCount: 0 });

    const options = transactionOptionsResponseSchema.parse(
      (await authenticated.get('/api/transactions/options').expect(200)).body,
    ).data;
    const account = options.accounts[0];
    expect(account).toBeDefined();
    const transaction = await authenticated
      .post('/api/transactions')
      .send({
        type: 'expense',
        description: 'Cycle 7 category test',
        amount: '20.00',
        currency: account?.currency,
        transactionDate: '2026-08-08T00:00:00.000Z',
        accountId: account?.id,
        destinationAccountId: null,
        categoryId: created.id,
        notes: null,
      })
      .expect(201);
    createdTransactionId = transaction.body.data.id as string;
    const budget = await authenticated
      .post('/api/dashboard/budgets')
      .send({ categoryId: created.id, month: '2026-10', amount: '50.00' })
      .expect(201);
    createdBudgetId = budget.body.data.id as string;

    const updated = categoryResponseSchema.parse(
      (
        await authenticated
          .put(`/api/categories/${created.id}`)
          .send({ name: 'Cycle 7 wellbeing', color: '#14B8A6', icon: 'heart' })
          .expect(200)
      ).body,
    ).data;
    expect(updated).toMatchObject({
      name: 'Cycle 7 wellbeing',
      transactionCount: 1,
      budgetCount: 1,
    });

    await authenticated
      .patch(`/api/categories/${created.id}/archive`)
      .send({ isArchived: true })
      .expect(200);
    const activeOptions = transactionOptionsResponseSchema.parse(
      (await authenticated.get('/api/transactions/options').expect(200)).body,
    ).data;
    expect(
      activeOptions.categories.some((category) => category.id === created.id),
    ).toBe(false);
    const archived = categoriesResponseSchema
      .parse(
        (
          await authenticated
            .get('/api/categories?includeArchived=true')
            .expect(200)
        ).body,
      )
      .data.find((category) => category.id === created.id);
    expect(archived).toMatchObject({ isArchived: true, transactionCount: 1 });
    const dashboard = dashboardResponseSchema.parse(
      (await authenticated.get('/api/dashboard?month=2026-10').expect(200))
        .body,
    ).data;
    expect(
      dashboard.budgets.items.find((item) => item.id === createdBudgetId)
        ?.category.isArchived,
    ).toBe(true);

    await authenticated
      .patch(`/api/categories/${created.id}/archive`)
      .send({ isArchived: false })
      .expect(200);
  });

  it('protects starter categories from editing', async () => {
    const categories = categoriesResponseSchema.parse(
      (await authenticated.get('/api/categories').expect(200)).body,
    ).data;
    const starter = categories.find((category) => category.isSystem);
    expect(starter).toBeDefined();
    const response = await authenticated
      .put(`/api/categories/${starter?.id}`)
      .send({ name: 'Changed starter', color: '#2563EB', icon: 'tag' })
      .expect(403);
    expect(response.body.error.code).toBe('SYSTEM_CATEGORY_READ_ONLY');
  });
});
