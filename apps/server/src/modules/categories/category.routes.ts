import {
  categoryArchiveSchema,
  categoryIdParamsSchema,
  categoryQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from '@savent/contracts';
import { Router } from 'express';

import {
  createCategory,
  listCategories,
  setCategoryArchived,
  updateCategory,
} from './category.service.js';

export const categoryRouter = Router();

categoryRouter.get('/', async (request, response) => {
  const query = categoryQuerySchema.parse(request.query);
  response
    .status(200)
    .json(
      await listCategories(
        response.locals.userId as string,
        query.includeArchived,
      ),
    );
});

categoryRouter.post('/', async (request, response) => {
  const input = createCategorySchema.parse(request.body);
  response
    .status(201)
    .json(await createCategory(response.locals.userId as string, input));
});

categoryRouter.put('/:id', async (request, response) => {
  const { id } = categoryIdParamsSchema.parse(request.params);
  const input = updateCategorySchema.parse(request.body);
  response
    .status(200)
    .json(await updateCategory(response.locals.userId as string, id, input));
});

categoryRouter.patch('/:id/archive', async (request, response) => {
  const { id } = categoryIdParamsSchema.parse(request.params);
  const { isArchived } = categoryArchiveSchema.parse(request.body);
  response
    .status(200)
    .json(
      await setCategoryArchived(
        response.locals.userId as string,
        id,
        isArchived,
      ),
    );
});
