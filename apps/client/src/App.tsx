import {
  type AuthUser,
  type Transaction,
  type TransactionQuery,
  type TransactionsResponse,
} from '@savent/contracts';
import { useEffect, useState, type FormEvent } from 'react';

import { fetchCurrentUser, logout } from './api/auth';
import {
  createTransaction,
  deleteTransaction,
  fetchTransactionOptions,
  fetchTransactions,
  updateTransaction,
} from './api/transactions';
import './App.css';
import { Accounts } from './components/Accounts';
import { AuthPage } from './components/AuthPage';
import { Categories } from './components/Categories';
import { Dashboard } from './components/Dashboard';
import { useNotifications } from './components/notification-context';
import { ThemeToggle } from './components/ThemeProvider';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { useDialogFocus } from './hooks/useDialogFocus';

type Options = Awaited<ReturnType<typeof fetchTransactionOptions>>;
type Filters = Pick<
  TransactionQuery,
  | 'search'
  | 'type'
  | 'accountId'
  | 'categoryId'
  | 'dateFrom'
  | 'dateTo'
  | 'sort'
>;

const emptyFilters: Filters = {
  search: '',
  type: undefined,
  accountId: undefined,
  categoryId: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  sort: 'date_desc',
};

const emptyResult: TransactionsResponse = {
  data: [],
  pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
  summary: { income: '0.00', expenses: '0.00' },
};

function formatCurrency(value: string) {
  return Number(value).toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
  });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

type TransactionAppProps = {
  user: AuthUser;
  onSignedOut: () => void;
};

function TransactionApp({ user, onSignedOut }: TransactionAppProps) {
  const { notify } = useNotifications();
  const [result, setResult] = useState<TransactionsResponse>(emptyResult);
  const [options, setOptions] = useState<Options>({
    accounts: [],
    categories: [],
  });
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const viewingDialogRef = useDialogFocus(Boolean(viewing), () =>
    setViewing(null),
  );
  const editingDialogRef = useDialogFocus(Boolean(editing), () =>
    setEditing(null),
  );
  const deletingDialogRef = useDialogFocus(Boolean(deleting), () =>
    setDeleting(null),
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchTransactionOptions(controller.signal)
      .then(setOptions)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Could not load form options.',
          );
        }
      });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const controller = new AbortController();

    fetchTransactions({ ...filters, page, pageSize }, controller.signal)
      .then(setResult)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Savent could not load your transactions.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [filters, page, pageSize, reloadKey]);

  function refreshTransactions() {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((current) => current + 1);
  }

  function changePage(nextPage: number) {
    setIsLoading(true);
    setLoadError(null);
    setPage(nextPage);
  }

  async function handleCreate(input: Parameters<typeof createTransaction>[0]) {
    await createTransaction(input);
    notify('Transaction added.');
    setPage(1);
    refreshTransactions();
  }

  async function handleUpdate(input: Parameters<typeof updateTransaction>[1]) {
    if (!editing) return;
    await updateTransaction(editing.id, input);
    notify('Transaction updated.');
    setEditing(null);
    refreshTransactions();
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteTransaction(deleting.id);
      notify('Transaction deleted.');
      setDeleting(null);
      if (result.data.length === 1 && page > 1) changePage(page - 1);
      else refreshTransactions();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'The transaction could not be deleted.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setLoadError(null);
    setFilters(draftFilters);
    setPage(1);
  }

  function clearFilters() {
    setIsLoading(true);
    setLoadError(null);
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  }

  async function handleLogout() {
    setIsSigningOut(true);
    setLoadError(null);
    try {
      await logout();
      notify('You have signed out.');
      onSignedOut();
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Could not sign out.',
      );
      setIsSigningOut(false);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Savent home">
          <span className="brand-mark">S</span>
          <span>Savent</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#overview">Overview</a>
          <a href="#accounts">Accounts</a>
          <a href="#categories">Categories</a>
          <a className="active" href="#transactions">
            Transactions
          </a>
          <a href="#reports">Reports</a>
        </nav>
        <div className="profile">
          <ThemeToggle compact />
          <span className="avatar">{initials(user.name)}</span>
          <span className="profile-details">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
          <button
            className="profile-logout"
            disabled={isSigningOut}
            onClick={() => void handleLogout()}
            type="button"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <Dashboard categories={options.categories} reloadKey={reloadKey} />

        <Accounts reloadKey={reloadKey} onChanged={refreshTransactions} />

        <Categories reloadKey={reloadKey} onChanged={refreshTransactions} />

        <section className="page-heading" id="transactions">
          <div>
            <p className="eyebrow">Money activity</p>
            <h1>Transactions</h1>
            <p>
              Search, review and manage every dollar moving through your
              accounts.
            </p>
          </div>
          <div
            className="summary-cards"
            aria-label="Filtered transaction summary"
          >
            <article>
              <span>Income</span>
              <strong className="positive">
                +{formatCurrency(result.summary.income)}
              </strong>
            </article>
            <article>
              <span>Expenses</span>
              <strong>-{formatCurrency(result.summary.expenses)}</strong>
            </article>
          </div>
        </section>

        {loadError ? (
          <section className="load-error" role="alert">
            <strong>We couldn’t load your transactions.</strong>
            <span>{loadError}</span>
          </section>
        ) : null}

        <form
          className="filter-panel"
          onSubmit={applyFilters}
          aria-label="Transaction filters"
        >
          <label className="filter-search">
            <span>Search</span>
            <input
              placeholder="Description or notes"
              value={draftFilters.search}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>Type</span>
            <select
              value={draftFilters.type ?? ''}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  type: (event.target.value || undefined) as Filters['type'],
                }))
              }
            >
              <option value="">All types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
              <option value="transfer">Transfers</option>
            </select>
          </label>
          <label>
            <span>Account</span>
            <select
              value={draftFilters.accountId ?? ''}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  accountId: event.target.value || undefined,
                }))
              }
            >
              <option value="">All accounts</option>
              {options.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Category</span>
            <select
              value={draftFilters.categoryId ?? ''}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  categoryId: event.target.value || undefined,
                }))
              }
            >
              <option value="">All categories</option>
              {options.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>From</span>
            <input
              type="date"
              value={draftFilters.dateFrom ?? ''}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  dateFrom: event.target.value || undefined,
                }))
              }
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="date"
              value={draftFilters.dateTo ?? ''}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  dateTo: event.target.value || undefined,
                }))
              }
            />
          </label>
          <label>
            <span>Sort</span>
            <select
              value={draftFilters.sort}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  sort: event.target.value as Filters['sort'],
                }))
              }
            >
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="amount_desc">Highest amount</option>
              <option value="amount_asc">Lowest amount</option>
            </select>
          </label>
          <div className="filter-actions">
            <button
              className="secondary-button"
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
            <button className="primary-button" type="submit">
              Apply filters
            </button>
          </div>
        </form>

        <div className="content-grid" id="transactions">
          <section className="panel transaction-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Activity</p>
                <h2>Transaction history</h2>
              </div>
              <span className="record-count">
                {result.pagination.totalItems}{' '}
                {result.pagination.totalItems === 1 ? 'record' : 'records'}
              </span>
            </div>
            {isLoading ? (
              <div className="loading-state" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                Loading transactions…
              </div>
            ) : (
              <TransactionList
                transactions={result.data}
                onView={setViewing}
                onEdit={setEditing}
                onDelete={(transaction) => {
                  setDeleteError(null);
                  setDeleting(transaction);
                }}
              />
            )}
            <div className="pagination" aria-label="Transaction pages">
              <label>
                Rows{' '}
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setIsLoading(true);
                    setLoadError(null);
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </label>
              <span>
                Page{' '}
                {result.pagination.totalPages === 0
                  ? 0
                  : result.pagination.page}{' '}
                of {result.pagination.totalPages}
              </span>
              <div>
                <button
                  className="secondary-button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => changePage(page - 1)}
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="secondary-button"
                  disabled={page >= result.pagination.totalPages || isLoading}
                  onClick={() => changePage(page + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          <aside className="panel form-panel">
            {options.accounts.length === 0 ? (
              <div className="loading-state">
                <span className="spinner" aria-hidden="true" />
                Preparing transaction form…
              </div>
            ) : (
              <TransactionForm
                accounts={options.accounts}
                categories={options.categories}
                onSubmit={handleCreate}
              />
            )}
          </aside>
        </div>
      </main>

      {viewing ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewing(null);
          }}
        >
          <section
            aria-labelledby="details-title"
            aria-modal="true"
            className="modal-card details-modal"
            ref={viewingDialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Transaction details</p>
                <h2 id="details-title">{viewing.description}</h2>
              </div>
              <button
                aria-label="Close details"
                className="icon-button"
                onClick={() => setViewing(null)}
                type="button"
              >
                ×
              </button>
            </div>
            <dl className="details-grid">
              <div>
                <dt>Type</dt>
                <dd>{viewing.type}</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{formatCurrency(viewing.amount)}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>
                  {new Date(viewing.transactionDate).toLocaleDateString(
                    'en-AU',
                  )}
                </dd>
              </div>
              <div>
                <dt>Account</dt>
                <dd>{viewing.account.name}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{viewing.category?.name ?? 'Uncategorised'}</dd>
              </div>
              {viewing.destinationAccount ? (
                <div>
                  <dt>Destination</dt>
                  <dd>{viewing.destinationAccount.name}</dd>
                </div>
              ) : null}
              <div className="detail-wide">
                <dt>Notes</dt>
                <dd>{viewing.notes || 'No notes'}</dd>
              </div>
            </dl>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setViewing(null)}
                type="button"
              >
                Close
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                }}
                type="button"
              >
                Edit transaction
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {editing ? (
        <div className="modal-backdrop">
          <section
            aria-label="Edit transaction"
            aria-modal="true"
            className="modal-card edit-modal"
            ref={editingDialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <TransactionForm
              key={editing.id}
              accounts={options.accounts}
              categories={options.categories}
              initialTransaction={editing}
              onCancel={() => setEditing(null)}
              onSubmit={handleUpdate}
            />
          </section>
        </div>
      ) : null}

      {deleting ? (
        <div className="modal-backdrop">
          <section
            aria-labelledby="delete-title"
            aria-modal="true"
            className="modal-card confirm-modal"
            ref={deletingDialogRef}
            role="alertdialog"
            tabIndex={-1}
          >
            <p className="eyebrow">Confirm deletion</p>
            <h2 id="delete-title">Delete “{deleting.description}”?</h2>
            <p>
              This removes the transaction permanently. This action cannot be
              undone.
            </p>
            {deleteError ? (
              <p className="form-error" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="modal-actions">
              <button
                className="secondary-button"
                disabled={isDeleting}
                onClick={() => setDeleting(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="danger-button"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                type="button"
              >
                {isDeleting ? 'Deleting…' : 'Delete transaction'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentUser(controller.signal)
      .then(setUser)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setSessionError(
            error instanceof Error
              ? error.message
              : 'Savent could not restore your session.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRestoringSession(false);
      });
    return () => controller.abort();
  }, []);

  if (isRestoringSession) {
    return (
      <main className="session-loading" aria-live="polite">
        <span className="brand-mark">S</span>
        <span className="spinner" aria-hidden="true" />
        Restoring your secure session…
      </main>
    );
  }

  if (!user) {
    return (
      <>
        {sessionError ? (
          <div className="session-banner" role="alert">
            {sessionError}
          </div>
        ) : null}
        <AuthPage
          onAuthenticated={(authenticatedUser) => {
            setSessionError(null);
            setUser(authenticatedUser);
          }}
        />
      </>
    );
  }

  return <TransactionApp user={user} onSignedOut={() => setUser(null)} />;
}

export default App;
