import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dashboardApi from '../api/dashboard';
import { Dashboard } from './Dashboard';

vi.mock('../api/dashboard');

const groceries = {
  id: '2ef02cc8-ecc3-4b35-a1f7-c66aad633b62',
  name: 'Groceries',
  kind: 'expense' as const,
  color: '#EA580C',
  icon: 'shopping-cart',
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardApi.fetchDashboard).mockResolvedValue({
      month: '2026-08',
      summary: {
        balance: '12500.00',
        income: '3300.00',
        expenses: '145.60',
        savings: '3154.40',
        savingsRate: 95.6,
        transactionCount: 2,
      },
      budgets: {
        allocated: '500.00',
        spent: '145.60',
        remaining: '354.40',
        items: [
          {
            id: '91d93a95-fb1a-4f2b-9ac0-e2b388756132',
            category: {
              id: groceries.id,
              name: groceries.name,
              color: groceries.color,
              isArchived: false,
            },
            month: '2026-08',
            amount: '500.00',
            spent: '145.60',
            remaining: '354.40',
            percentage: 29.1,
            status: 'on_track',
          },
        ],
      },
      report: {
        monthly: [
          {
            month: '2026-08',
            label: 'Aug',
            income: '3300.00',
            expenses: '145.60',
          },
        ],
        categories: [
          {
            categoryId: groceries.id,
            name: groceries.name,
            color: groceries.color,
            amount: '145.60',
            percentage: 100,
          },
        ],
      },
    });
  });

  it('renders summary, budget progress, and spending reports', async () => {
    render(<Dashboard categories={[groceries]} reloadKey={0} />);

    expect(await screen.findByText('$12,500.00')).toBeInTheDocument();
    expect(screen.getAllByText('Groceries').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('29.1% used · $354.40 left')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Income vs spending' }),
    ).toBeInTheDocument();
  });
});
