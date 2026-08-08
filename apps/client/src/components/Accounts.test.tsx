import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as accountsApi from '../api/accounts';
import { Accounts } from './Accounts';
import { NotificationProvider } from './Notifications';

vi.mock('../api/accounts');

const account = {
  id: '0edb29ee-5c78-48c6-bfe3-76a781960899',
  name: 'Everyday',
  type: 'checking' as const,
  currency: 'AUD',
  openingBalance: '1000.00',
  balance: '1250.00',
  isArchived: false,
  createdAt: '2026-08-08T00:00:00.000Z',
  updatedAt: '2026-08-08T00:00:00.000Z',
};

describe('Accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountsApi.fetchAccounts).mockResolvedValue([account]);
    vi.mocked(accountsApi.createAccount).mockResolvedValue({
      ...account,
      id: '27d49326-ecb8-4439-938f-5be931001bd4',
      name: 'Holiday',
    });
  });

  it('shows account balances and creates an account', async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    render(
      <NotificationProvider>
        <Accounts reloadKey={0} onChanged={onChanged} />
      </NotificationProvider>,
    );

    expect(await screen.findByText('$1,250.00')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Name'), 'Holiday');
    await user.clear(screen.getByLabelText('Opening balance'));
    await user.type(screen.getByLabelText('Opening balance'), '500.00');
    await user.click(screen.getByRole('button', { name: 'Add account' }));

    expect(accountsApi.createAccount).toHaveBeenCalledWith({
      name: 'Holiday',
      type: 'checking',
      currency: 'AUD',
      openingBalance: '500.00',
    });
    expect(onChanged).toHaveBeenCalledOnce();
  });
});
