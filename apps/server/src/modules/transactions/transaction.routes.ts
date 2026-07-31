import { createTransactionSchema } from '@savent/contracts';
import { Router } from 'express';

import {
  createTransaction,
  getTransactionOptions,
  listTransactions,
} from './transaction.service.js';

export const transactionRouter = Router();

transactionRouter.get('/', async (_request, response) => {
  response.status(200).json(await listTransactions());
});

transactionRouter.get('/options', async (_request, response) => {
  response.status(200).json(await getTransactionOptions());
});

transactionRouter.post('/', async (request, response) => {
  const input = createTransactionSchema.parse(request.body);
  response.status(201).json(await createTransaction(input));
});
