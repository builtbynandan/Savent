import {
  apiErrorSchema,
  deleteTransactionResponseSchema,
  transactionOptionsResponseSchema,
  transactionResponseSchema,
  transactionsResponseSchema,
  type CreateTransactionInput,
  type TransactionQuery,
  type UpdateTransactionInput,
} from '@savent/contracts';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function request(input: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${input}`, init);
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.error.message
        : 'The request could not be completed',
    );
  }

  return body;
}

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
  const body = await request(`/transactions${suffix}`, { signal });
  return transactionsResponseSchema.parse(body);
}

export async function fetchTransactionOptions(signal?: AbortSignal) {
  const body = await request('/transactions/options', { signal });
  return transactionOptionsResponseSchema.parse(body).data;
}

export async function createTransaction(input: CreateTransactionInput) {
  const body = await request('/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return transactionResponseSchema.parse(body).data;
}

export async function fetchTransaction(id: string, signal?: AbortSignal) {
  const body = await request(`/transactions/${id}`, { signal });
  return transactionResponseSchema.parse(body).data;
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
) {
  const body = await request(`/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return transactionResponseSchema.parse(body).data;
}

export async function deleteTransaction(id: string) {
  const body = await request(`/transactions/${id}`, { method: 'DELETE' });
  return deleteTransactionResponseSchema.parse(body).data;
}
