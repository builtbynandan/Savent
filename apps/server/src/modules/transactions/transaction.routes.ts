import {
  createTransactionSchema,
  transactionIdParamsSchema,
  transactionQuerySchema,
  updateTransactionSchema,
} from '@savent/contracts';
import { Router } from 'express';

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactionOptions,
  listTransactions,
  updateTransaction,
} from './transaction.service.js';

export const transactionRouter = Router();

transactionRouter.get('/', async (request, response) => {
  const query = transactionQuerySchema.parse(request.query);
  response
    .status(200)
    .json(await listTransactions(response.locals.userId as string, query));
});

transactionRouter.get('/options', async (_request, response) => {
  response
    .status(200)
    .json(await getTransactionOptions(response.locals.userId as string));
});

transactionRouter.post('/', async (request, response) => {
  const input = createTransactionSchema.parse(request.body);
  response
    .status(201)
    .json(await createTransaction(response.locals.userId as string, input));
});

transactionRouter.get('/:id', async (request, response) => {
  const { id } = transactionIdParamsSchema.parse(request.params);
  response
    .status(200)
    .json(await getTransaction(response.locals.userId as string, id));
});

transactionRouter.put('/:id', async (request, response) => {
  const { id } = transactionIdParamsSchema.parse(request.params);
  const input = updateTransactionSchema.parse(request.body);
  response
    .status(200)
    .json(await updateTransaction(response.locals.userId as string, id, input));
});

transactionRouter.delete('/:id', async (request, response) => {
  const { id } = transactionIdParamsSchema.parse(request.params);
  response
    .status(200)
    .json(await deleteTransaction(response.locals.userId as string, id));
});
