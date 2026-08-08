import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TransactionForm } from './TransactionForm';

const accounts = [
  {
    id: 'a26f6ef8-2ed7-4f53-8236-11643b97f0c4',
    name: 'Everyday',
    type: 'checking' as const,
    currency: 'AUD',
  },
  {
    id: '9dc88a33-3992-4991-9a43-16c803cacbf7',
    name: 'Savings',
    type: 'savings' as const,
    currency: 'AUD',
  },
];

const categories = [
  {
    id: '6680575a-f74e-495c-a39d-2f56a389df9e',
    name: 'Groceries',
    kind: 'expense' as const,
    color: '#EA580C',
    icon: 'shopping-cart',
  },
  {
    id: 'd6effc73-a7f8-4646-b46c-05020c7426cc',
    name: 'Salary',
    kind: 'income' as const,
    color: '#16A34A',
    icon: 'wallet',
  },
];

describe('TransactionForm', () => {
  it('submits an expense using the selected account and category', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TransactionForm
        accounts={accounts}
        categories={categories}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('Description'), 'Weekly groceries');
    await user.type(screen.getByLabelText('Amount'), '42.50');
    await user.selectOptions(
      screen.getByLabelText('Category'),
      categories[0].id,
    );
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expense',
          description: 'Weekly groceries',
          amount: '42.50',
          currency: 'AUD',
          accountId: accounts[0].id,
          categoryId: categories[0].id,
        }),
      ),
    );
  });

  it('uses the first account when options arrive after the initial render', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <TransactionForm
        accounts={[]}
        categories={categories}
        onSubmit={onSubmit}
      />,
    );

    rerender(
      <TransactionForm
        accounts={accounts}
        categories={categories}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('Description'), 'Late options');
    await user.type(screen.getByLabelText('Amount'), '18.75');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: accounts[0].id,
          amount: '18.75',
        }),
      ),
    );
  });

  it('only shows categories matching the selected type', async () => {
    const user = userEvent.setup();

    render(
      <TransactionForm
        accounts={accounts}
        categories={categories}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('option', { name: 'Groceries' })).toBeVisible();
    expect(
      screen.queryByRole('option', { name: 'Salary' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Income' }));

    expect(screen.getByRole('option', { name: 'Salary' })).toBeVisible();
    expect(
      screen.queryByRole('option', { name: 'Groceries' }),
    ).not.toBeInTheDocument();
  });

  it('submits a transfer between different accounts', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <TransactionForm
        accounts={accounts}
        categories={categories}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Transfer' }));
    await user.type(screen.getByLabelText('Description'), 'Move to savings');
    await user.type(screen.getByLabelText('Amount'), '250');
    await user.selectOptions(
      screen.getByLabelText('To account'),
      accounts[1].id,
    );
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'transfer',
          accountId: accounts[0].id,
          destinationAccountId: accounts[1].id,
          categoryId: null,
        }),
      ),
    );
  });

  it('prefills and saves an existing transaction', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <TransactionForm
        accounts={accounts}
        categories={categories}
        initialTransaction={{
          id: '5107e223-b5e8-4cab-8783-9a966e9dc420',
          userId: 'a682be9a-0eb5-43a2-b319-b0dbe8a8456f',
          type: 'expense',
          description: 'Original groceries',
          amount: '42.50',
          currency: 'AUD',
          transactionDate: '2026-08-01T12:00:00.000Z',
          accountId: accounts[0].id,
          destinationAccountId: null,
          categoryId: categories[0].id,
          notes: 'Original note',
          createdAt: '2026-08-01T12:00:00.000Z',
          updatedAt: '2026-08-01T12:00:00.000Z',
          account: accounts[0],
          destinationAccount: null,
          category: categories[0],
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText('Amount')).toHaveValue(42.5);
    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), 'Edited groceries');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Edited groceries',
          amount: '42.50',
          notes: 'Original note',
        }),
      ),
    );
  });
});
