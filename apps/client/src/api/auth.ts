import {
  authResponseSchema,
  logoutResponseSchema,
  type LoginInput,
  type RegisterInput,
} from '@savent/contracts';

import { ApiError, apiRequest } from './client';

export async function fetchCurrentUser(signal?: AbortSignal) {
  try {
    const body = await apiRequest('/auth/me', { signal });
    return authResponseSchema.parse(body).data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function register(input: RegisterInput) {
  const body = await apiRequest('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return authResponseSchema.parse(body).data.user;
}

export async function login(input: LoginInput) {
  const body = await apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return authResponseSchema.parse(body).data.user;
}

export async function logout() {
  const body = await apiRequest('/auth/logout', { method: 'POST' });
  return logoutResponseSchema.parse(body).data;
}
