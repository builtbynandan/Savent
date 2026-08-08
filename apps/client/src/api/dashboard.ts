import {
  budgetResponseSchema,
  dashboardResponseSchema,
  deleteBudgetResponseSchema,
  type BudgetInput,
} from '@savent/contracts';

import { apiRequest } from './client';

export async function fetchDashboard(month: string, signal?: AbortSignal) {
  const body = await apiRequest(
    `/dashboard?month=${encodeURIComponent(month)}`,
    {
      signal,
    },
  );
  return dashboardResponseSchema.parse(body).data;
}

export async function createBudget(input: BudgetInput) {
  const body = await apiRequest('/dashboard/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return budgetResponseSchema.parse(body).data;
}

export async function updateBudget(id: string, input: BudgetInput) {
  const body = await apiRequest(`/dashboard/budgets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return budgetResponseSchema.parse(body).data;
}

export async function deleteBudget(id: string) {
  const body = await apiRequest(`/dashboard/budgets/${id}`, {
    method: 'DELETE',
  });
  return deleteBudgetResponseSchema.parse(body).data;
}
