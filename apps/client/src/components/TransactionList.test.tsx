import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TransactionList } from './TransactionList';

const transaction = {
  id: '5107e223-b5e8-4cab-8783-9a966e9dc420',
  userId: 'a682be9a-0eb5-43a2-b319-b0dbe8a8456f',
  type: 'expense' as const,
  description: 'Groceries',
  amount: '42.50',
  currency: 'AUD',
  transactionDate: '2026-08-01T12:00:00.000Z',
  accountId: 'a26f6ef8-2ed7-4f53-8236-11643b97f0c4',
  destinationAccountId: null,
  categoryId: null,
  notes: null,
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-01T12:00:00.000Z',
  account: {
    id: 'a26f6ef8-2ed7-4f53-8236-11643b97f0c4',
    name: 'Everyday',
    type: 'checking' as const,
    currency: 'AUD',
  },
  destinationAccount: null,
  category: null,
};

describe('TransactionList', () => {
  it('routes row actions to the selected transaction', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <TransactionList
        transactions={[transaction]}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'View Groceries' }));
    await user.click(screen.getByRole('button', { name: 'Edit Groceries' }));
    await user.click(screen.getByRole('button', { name: 'Delete Groceries' }));

    expect(onView).toHaveBeenCalledWith(transaction);
    expect(onEdit).toHaveBeenCalledWith(transaction);
    expect(onDelete).toHaveBeenCalledWith(transaction);
  });
});
