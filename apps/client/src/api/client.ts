import { apiErrorSchema } from '@savent/contracts';

export const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function apiRequest(input: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${input}`, {
    credentials: 'include',
    ...init,
  });
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
