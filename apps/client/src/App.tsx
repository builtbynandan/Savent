import { type Transaction } from '@savent/contracts';
import { useEffect, useState } from 'react';

import {
  createTransaction,
  fetchTransactionOptions,
  fetchTransactions,
} from './api/transactions';
import './App.css';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';

type Options = Awaited<ReturnType<typeof fetchTransactionOptions>>;

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [options, setOptions] = useState<Options>({
    accounts: [],
    categories: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPage() {
      try {
        const [transactionData, optionData] = await Promise.all([
          fetchTransactions(controller.signal),
          fetchTransactionOptions(controller.signal),
        ]);

        setTransactions(transactionData);
        setOptions(optionData);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Savent could not load your transactions.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();
    return () => controller.abort();
  }, []);

  async function handleCreate(input: Parameters<typeof createTransaction>[0]) {
    const transaction = await createTransaction(input);
    setTransactions((current) => [transaction, ...current]);
  }

  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const totalExpenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Savent home">
          <span className="brand-mark">S</span>
          <span>Savent</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#overview">Overview</a>
          <a className="active" href="#transactions">
            Transactions
          </a>
        </nav>
        <div className="profile">
          <span className="avatar">AN</span>
          <span>
            <strong>Ava Nguyen</strong>
            <small>Demo workspace</small>
          </span>
        </div>
      </header>

      <main>
        <section className="page-heading" id="overview">
          <div>
            <p className="eyebrow">Money activity</p>
            <h1>Transactions</h1>
            <p>Track every dollar moving in and out of your accounts.</p>
          </div>
          <div className="summary-cards" aria-label="Transaction summary">
            <article>
              <span>Income</span>
              <strong className="positive">
                +
                {totalIncome.toLocaleString('en-AU', {
                  style: 'currency',
                  currency: 'AUD',
                })}
              </strong>
            </article>
            <article>
              <span>Expenses</span>
              <strong>
                -
                {totalExpenses.toLocaleString('en-AU', {
                  style: 'currency',
                  currency: 'AUD',
                })}
              </strong>
            </article>
          </div>
        </section>

        {loadError ? (
          <section className="load-error" role="alert">
            <strong>We couldn’t load your transactions.</strong>
            <span>{loadError}</span>
          </section>
        ) : null}

        <div className="content-grid" id="transactions">
          <section className="panel transaction-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Activity</p>
                <h2>Recent transactions</h2>
              </div>
              <span className="record-count">
                {transactions.length}{' '}
                {transactions.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {isLoading ? (
              <div className="loading-state" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                Loading transactions…
              </div>
            ) : (
              <TransactionList transactions={transactions} />
            )}
          </section>

          <aside className="panel form-panel">
            {isLoading ? (
              <div className="loading-state" aria-live="polite">
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
    </div>
  );
}

export default App;
