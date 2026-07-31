import {
  apiErrorSchema,
  transactionOptionsResponseSchema,
  transactionResponseSchema,
  transactionsResponseSchema,
  type CreateTransactionInput,
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

export async function fetchTransactions(signal?: AbortSignal) {
  const body = await request('/transactions', { signal });
  return transactionsResponseSchema.parse(body).data;
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
