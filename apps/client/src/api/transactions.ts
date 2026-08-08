import {
  deleteTransactionResponseSchema,
  transactionOptionsResponseSchema,
  transactionResponseSchema,
  transactionsResponseSchema,
  type CreateTransactionInput,
  type TransactionQuery,
  type UpdateTransactionInput,
} from '@savent/contracts';

import { apiRequest } from './client';

export async function fetchTransactions(
  query: Partial<TransactionQuery> = {},
  signal?: AbortSignal,
) {
  const parameters = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      parameters.set(key, String(value));
    }
  });

  const suffix = parameters.size > 0 ? `?${parameters.toString()}` : '';
  const body = await apiRequest(`/transactions${suffix}`, { signal });
  return transactionsResponseSchema.parse(body);
}

export async function fetchTransactionOptions(signal?: AbortSignal) {
  const body = await apiRequest('/transactions/options', { signal });
  return transactionOptionsResponseSchema.parse(body).data;
}

export async function createTransaction(input: CreateTransactionInput) {
  const body = await apiRequest('/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return transactionResponseSchema.parse(body).data;
}

export async function fetchTransaction(id: string, signal?: AbortSignal) {
  const body = await apiRequest(`/transactions/${id}`, { signal });
  return transactionResponseSchema.parse(body).data;
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
) {
  const body = await apiRequest(`/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return transactionResponseSchema.parse(body).data;
}

export async function deleteTransaction(id: string) {
  const body = await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
  return deleteTransactionResponseSchema.parse(body).data;
}
