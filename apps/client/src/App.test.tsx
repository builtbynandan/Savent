import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchCurrentUser } from './api/auth';
import { sessionExpiredEvent } from './api/client';
import { fetchTransactionOptions, fetchTransactions } from './api/transactions';
import App from './App';
import { NotificationProvider } from './components/Notifications';
import { ThemeProvider } from './components/ThemeProvider';

vi.mock('./api/auth', () => ({
  fetchCurrentUser: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('./api/transactions', () => ({
  createTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  fetchTransactionOptions: vi.fn(),
  fetchTransactions: vi.fn(),
  updateTransaction: vi.fn(),
}));
vi.mock('./components/Accounts', () => ({
  Accounts: () => <h1>Accounts workspace</h1>,
}));
vi.mock('./components/AuthPage', () => ({
  AuthPage: () => <h1>Sign in to Savent</h1>,
}));
vi.mock('./components/Categories', () => ({
  Categories: () => <h1>Categories workspace</h1>,
}));
vi.mock('./components/Dashboard', () => ({
  Dashboard: ({ view }: { view: string }) => <h1>{view} workspace</h1>,
}));
vi.mock('./components/TransactionForm', () => ({
  TransactionForm: () => <div>Transaction form</div>,
}));
vi.mock('./components/TransactionList', () => ({
  TransactionList: () => <div>Transaction list</div>,
}));

function renderApp() {
  return render(
    <ThemeProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ThemeProvider>,
  );
}

describe('App shell', () => {
  beforeEach(() => {
    window.location.hash = '#overview';
    vi.clearAllMocks();
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: '5bba1e8a-bd9b-498e-b243-220684364115',
      name: 'Ava Nguyen',
      email: 'demo@savent.app',
    });
    vi.mocked(fetchTransactionOptions).mockResolvedValue({
      accounts: [],
      categories: [],
    });
    vi.mocked(fetchTransactions).mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
      summary: { income: '0.00', expenses: '0.00' },
    });
  });

  it('switches focused workspaces without fetching hidden transactions', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('overview workspace')).toBeInTheDocument();
    expect(fetchTransactions).not.toHaveBeenCalled();

    await user.click(screen.getByRole('link', { name: 'Accounts' }));
    expect(screen.getByText('Accounts workspace')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(screen.getByRole('link', { name: 'Transactions' }));
    expect(await screen.findByText('Transaction list')).toBeInTheDocument();
    expect(fetchTransactions).toHaveBeenCalledOnce();
  });

  it('returns to sign-in when an authenticated session expires', async () => {
    renderApp();
    expect(await screen.findByText('overview workspace')).toBeInTheDocument();

    window.dispatchEvent(new Event(sessionExpiredEvent));

    await waitFor(() =>
      expect(screen.getByText('Sign in to Savent')).toBeInTheDocument(),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your session expired. Sign in again to continue.',
    );
  });
});
