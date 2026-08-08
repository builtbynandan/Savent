import { apiErrorSchema } from '@savent/contracts';

export const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const sessionExpiredEvent = 'savent:session-expired';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(input: string, init?: RequestInit) {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${input}`, {
      credentials: 'include',
      ...init,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error;
    throw new ApiError(
      'Savent could not reach the secure API. Check that the server is running and try again.',
      0,
      'NETWORK_ERROR',
    );
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);
    const apiError = new ApiError(
      parsedError.success
        ? parsedError.data.error.message
        : response.status >= 500
          ? 'Savent is temporarily unavailable. Please try again.'
          : 'The request could not be completed.',
      response.status,
      parsedError.success ? parsedError.data.error.code : 'REQUEST_FAILED',
    );

    if (
      response.status === 401 &&
      !input.startsWith('/auth/') &&
      typeof window !== 'undefined'
    ) {
      window.dispatchEvent(new Event(sessionExpiredEvent));
    }

    throw apiError;
  }

  return body;
}
