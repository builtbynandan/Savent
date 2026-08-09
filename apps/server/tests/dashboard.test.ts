import {
  budgetResponseSchema,
  dashboardResponseSchema,
} from '@savent/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const authenticated = request.agent(app);
const createdBudgetIds: string[] = [];

beforeAll(async () => {
  await authenticated
    .post('/api/auth/login')
    .send({ email: 'demo@savent.app', password: 'Demo1234!' })
    .expect(200);
});

afterAll(async () => {
  if (createdBudgetIds.length > 0) {
    await prisma.budget.deleteMany({
      where: { id: { in: createdBudgetIds } },
    });
  }
  await prisma.$disconnect();
});

describe('dashboard API', () => {
  it('returns monthly KPIs, budget progress, and reports', async () => {
    const response = await authenticated
      .get('/api/dashboard')
      .query({ month: '2026-08' })
      .expect(200);
    const dashboard = dashboardResponseSchema.parse(response.body).data;

    expect(dashboard.summary).toMatchObject({
      income: '3300.00',
      expenses: '2340.84',
      savings: '959.16',
      transactionCount: 9,
    });
    expect(dashboard.budgets.items).toHaveLength(6);
    expect(dashboard.report.monthly).toHaveLength(6);
    expect(dashboard.report.categories[0]).toMatchObject({
      name: 'Rent',
      amount: '1800.00',
    });
  });

  it('creates, updates, and deletes a user-owned budget', async () => {
    const dashboard = dashboardResponseSchema.parse(
      (await authenticated.get('/api/dashboard?month=2026-08').expect(200))
        .body,
    ).data;
    const categoryId = dashboard.budgets.items.find(
      (budget) => budget.category.name === 'Groceries',
    )?.category.id;
    expect(categoryId).toBeDefined();

    const createResponse = await authenticated
      .post('/api/dashboard/budgets')
      .send({ categoryId, month: '2026-09', amount: '525.00' })
      .expect(201);
    const created = budgetResponseSchema.parse(createResponse.body).data;
    createdBudgetIds.push(created.id);
    expect(created).toMatchObject({ amount: '525.00', spent: '0.00' });

    const updateResponse = await authenticated
      .put(`/api/dashboard/budgets/${created.id}`)
      .send({ categoryId, month: '2026-09', amount: '600.00' })
      .expect(200);
    expect(budgetResponseSchema.parse(updateResponse.body).data.amount).toBe(
      '600.00',
    );

    await authenticated
      .delete(`/api/dashboard/budgets/${created.id}`)
      .expect(200);
    await authenticated
      .delete(`/api/dashboard/budgets/${created.id}`)
      .expect(404);
  });
});
