import {
  apiErrorSchema,
  authResponseSchema,
  logoutResponseSchema,
  transactionOptionsResponseSchema,
  transactionsResponseSchema,
} from '@savent/contracts';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const registeredEmails: string[] = [];

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: registeredEmails } } });
  await prisma.$disconnect();
});

describe('authentication API', () => {
  it('protects private transaction routes', async () => {
    const response = await request(app).get('/api/transactions').expect(401);
    expect(apiErrorSchema.parse(response.body).error.code).toBe(
      'AUTHENTICATION_REQUIRED',
    );
  });

  it('registers a user with an isolated starter workspace and logs out', async () => {
    const email = `cycle3-${Date.now()}@example.com`;
    registeredEmails.push(email);
    const agent = request.agent(app);

    const registerResponse = await agent
      .post('/api/auth/register')
      .send({ name: 'Cycle Three', email, password: 'strong-password' })
      .expect(201);
    const registered = authResponseSchema.parse(registerResponse.body).data
      .user;
    expect(registered).toMatchObject({ name: 'Cycle Three', email });

    const meResponse = await agent.get('/api/auth/me').expect(200);
    expect(authResponseSchema.parse(meResponse.body).data.user.id).toBe(
      registered.id,
    );

    const optionsResponse = await agent
      .get('/api/transactions/options')
      .expect(200);
    const options = transactionOptionsResponseSchema.parse(
      optionsResponse.body,
    ).data;
    expect(options.accounts).toHaveLength(2);
    expect(options.categories).toHaveLength(5);

    const transactionsResponse = await agent
      .get('/api/transactions')
      .expect(200);
    expect(
      transactionsResponseSchema.parse(transactionsResponse.body).data,
    ).toHaveLength(0);

    const logoutResponse = await agent.post('/api/auth/logout').expect(200);
    expect(logoutResponseSchema.parse(logoutResponse.body).data.success).toBe(
      true,
    );
    await agent.get('/api/auth/me').expect(401);
  });

  it('rejects bad credentials and restores a valid login session', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@savent.app', password: 'incorrect-password' })
      .expect(401);

    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'DEMO@SAVENT.APP', password: 'Demo1234!' })
      .expect(200);
    const meResponse = await agent.get('/api/auth/me').expect(200);
    expect(authResponseSchema.parse(meResponse.body).data.user.email).toBe(
      'demo@savent.app',
    );
  });

  it('does not expose another user’s transaction', async () => {
    const demoAgent = request.agent(app);
    await demoAgent
      .post('/api/auth/login')
      .send({ email: 'demo@savent.app', password: 'Demo1234!' })
      .expect(200);
    const demoTransactions = transactionsResponseSchema.parse(
      (await demoAgent.get('/api/transactions').expect(200)).body,
    ).data;
    expect(demoTransactions[0]).toBeDefined();

    const email = `isolated-${Date.now()}@example.com`;
    registeredEmails.push(email);
    const otherAgent = request.agent(app);
    await otherAgent
      .post('/api/auth/register')
      .send({ name: 'Isolated User', email, password: 'strong-password' })
      .expect(201);
    await otherAgent
      .get(`/api/transactions/${demoTransactions[0]?.id}`)
      .expect(404);
  });
});
