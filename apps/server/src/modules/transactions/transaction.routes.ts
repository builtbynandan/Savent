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
  response.status(200).json(await listTransactions(query));
});

transactionRouter.get('/options', async (_request, response) => {
  response.status(200).json(await getTransactionOptions());
});

transactionRouter.post('/', async (request, response) => {
  const input = createTransactionSchema.parse(request.body);
  response.status(201).json(await createTransaction(input));
});

transactionRouter.get('/:id', async (request, response) => {
  const { id } = transactionIdParamsSchema.parse(request.params);
  response.status(200).json(await getTransaction(id));
});

transactionRouter.put('/:id', async (request, response) => {
  const { id } = transactionIdParamsSchema.parse(request.params);
  const input = updateTransactionSchema.parse(request.body);
  response.status(200).json(await updateTransaction(id, input));
});

transactionRouter.delete('/:id', async (request, response) => {
  const { id } = transactionIdParamsSchema.parse(request.params);
  response.status(200).json(await deleteTransaction(id));
});
