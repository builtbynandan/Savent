import {
  budgetIdParamsSchema,
  budgetInputSchema,
  dashboardQuerySchema,
} from '@savent/contracts';
import { Router } from 'express';

import {
  createBudget,
  deleteBudget,
  getDashboard,
  updateBudget,
} from './dashboard.service.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', async (request, response) => {
  const query = dashboardQuerySchema.parse(request.query);
  response
    .status(200)
    .json(await getDashboard(response.locals.userId as string, query));
});

dashboardRouter.post('/budgets', async (request, response) => {
  const input = budgetInputSchema.parse(request.body);
  response
    .status(201)
    .json(await createBudget(response.locals.userId as string, input));
});

dashboardRouter.put('/budgets/:id', async (request, response) => {
  const { id } = budgetIdParamsSchema.parse(request.params);
  const input = budgetInputSchema.parse(request.body);
  response
    .status(200)
    .json(await updateBudget(response.locals.userId as string, id, input));
});

dashboardRouter.delete('/budgets/:id', async (request, response) => {
  const { id } = budgetIdParamsSchema.parse(request.params);
  response
    .status(200)
    .json(await deleteBudget(response.locals.userId as string, id));
});
