import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dashboardApi from '../api/dashboard';
import { Dashboard } from './Dashboard';
import { NotificationProvider } from './Notifications';

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

  it('renders focused overview and report views', async () => {
    const { rerender } = render(
      <NotificationProvider>
        <Dashboard categories={[groceries]} reloadKey={0} />
      </NotificationProvider>,
    );

    expect(await screen.findByText('$12,500.00')).toBeInTheDocument();
    expect(screen.getAllByText('Groceries').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('29.1% used · $354.40 left')).toBeInTheDocument();

    rerender(
      <NotificationProvider>
        <Dashboard categories={[groceries]} reloadKey={0} view="reports" />
      </NotificationProvider>,
    );
    expect(
      screen.getByRole('heading', { name: 'Income vs spending' }),
    ).toBeInTheDocument();
  });

  it('refreshes the dashboard immediately after adding a budget', async () => {
    const user = userEvent.setup();
    vi.mocked(dashboardApi.createBudget).mockResolvedValue({
      id: '3fb98485-f3d5-450d-bb55-55800fda268d',
      category: {
        id: groceries.id,
        name: groceries.name,
        color: groceries.color,
        isArchived: false,
      },
      month: '2026-08',
      amount: '3500.00',
      spent: '145.60',
      remaining: '3354.40',
      percentage: 4.2,
      status: 'on_track',
    });
    render(
      <NotificationProvider>
        <Dashboard categories={[groceries]} reloadKey={0} />
      </NotificationProvider>,
    );

    await screen.findByText('$12,500.00');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Budget category' }),
      groceries.id,
    );
    await user.type(
      screen.getByRole('spinbutton', { name: 'Budget amount' }),
      '3500',
    );
    await user.click(screen.getByRole('button', { name: 'Add budget' }));

    expect(dashboardApi.createBudget).toHaveBeenCalledWith({
      categoryId: groceries.id,
      amount: '3500',
      month: '2026-08',
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Budget added.',
    );
    expect(dashboardApi.fetchDashboard).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole('spinbutton', { name: 'Budget amount' }),
    ).toHaveValue(null);
  });
});
