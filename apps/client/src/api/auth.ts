import {
  authResponseSchema,
  logoutResponseSchema,
  type LoginInput,
  type RegisterInput,
} from '@savent/contracts';

import { apiBaseUrl, apiRequest } from './client';

export async function fetchCurrentUser(signal?: AbortSignal) {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    credentials: 'include',
    signal,
  });

  if (response.status === 401) return null;
  const body: unknown = await response.json();
  if (!response.ok) throw new Error('Savent could not restore your session.');
  return authResponseSchema.parse(body).data.user;
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
