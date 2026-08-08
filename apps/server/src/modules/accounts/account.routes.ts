import {
  accountArchiveSchema,
  accountIdParamsSchema,
  accountQuerySchema,
  createAccountSchema,
  updateAccountSchema,
} from '@savent/contracts';
import { Router } from 'express';

import {
  createAccount,
  listAccounts,
  setAccountArchived,
  updateAccount,
} from './account.service.js';

export const accountRouter = Router();

accountRouter.get('/', async (request, response) => {
  const query = accountQuerySchema.parse(request.query);
  response
    .status(200)
    .json(
      await listAccounts(
        response.locals.userId as string,
        query.includeArchived,
      ),
    );
});

accountRouter.post('/', async (request, response) => {
  const input = createAccountSchema.parse(request.body);
  response
    .status(201)
    .json(await createAccount(response.locals.userId as string, input));
});

accountRouter.put('/:id', async (request, response) => {
  const { id } = accountIdParamsSchema.parse(request.params);
  const input = updateAccountSchema.parse(request.body);
  response
    .status(200)
    .json(await updateAccount(response.locals.userId as string, id, input));
});

accountRouter.patch('/:id/archive', async (request, response) => {
  const { id } = accountIdParamsSchema.parse(request.params);
  const { isArchived } = accountArchiveSchema.parse(request.body);
  response
    .status(200)
    .json(
      await setAccountArchived(
        response.locals.userId as string,
        id,
        isArchived,
      ),
    );
});
