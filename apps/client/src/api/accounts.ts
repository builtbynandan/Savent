import {
  accountResponseSchema,
  accountsResponseSchema,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@savent/contracts';

import { apiRequest } from './client';

export async function fetchAccounts(
  includeArchived = false,
  signal?: AbortSignal,
) {
  const suffix = includeArchived ? '?includeArchived=true' : '';
  const body = await apiRequest(`/accounts${suffix}`, { signal });
  return accountsResponseSchema.parse(body).data;
}

export async function createAccount(input: CreateAccountInput) {
  const body = await apiRequest('/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return accountResponseSchema.parse(body).data;
}

export async function updateAccount(id: string, input: UpdateAccountInput) {
  const body = await apiRequest(`/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return accountResponseSchema.parse(body).data;
}

export async function setAccountArchived(id: string, isArchived: boolean) {
  const body = await apiRequest(`/accounts/${id}/archive`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isArchived }),
  });
  return accountResponseSchema.parse(body).data;
}
