import {
  categoriesResponseSchema,
  categoryResponseSchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@savent/contracts';

import { apiRequest } from './client';

export async function fetchCategories(
  includeArchived = false,
  signal?: AbortSignal,
) {
  const suffix = includeArchived ? '?includeArchived=true' : '';
  const body = await apiRequest(`/categories${suffix}`, { signal });
  return categoriesResponseSchema.parse(body).data;
}

export async function createCategory(input: CreateCategoryInput) {
  const body = await apiRequest('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return categoryResponseSchema.parse(body).data;
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const body = await apiRequest(`/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return categoryResponseSchema.parse(body).data;
}

export async function setCategoryArchived(id: string, isArchived: boolean) {
  const body = await apiRequest(`/categories/${id}/archive`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isArchived }),
  });
  return categoryResponseSchema.parse(body).data;
}
