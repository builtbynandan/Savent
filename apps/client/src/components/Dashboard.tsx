import type {
  BudgetInput,
  BudgetProgress,
  CategorySummary,
  DashboardResponse,
} from '@savent/contracts';
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';

import {
  createBudget,
  deleteBudget,
  fetchDashboard,
  updateBudget,
} from '../api/dashboard';

type DashboardData = DashboardResponse['data'];

type DashboardProps = {
  categories: CategorySummary[];
  reloadKey: number;
};

function currency(value: string) {
  return Number(value).toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
  });
}

function monthLabel(month: string) {
  return new Intl.DateTimeFormat('en-AU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00.000Z`));
}

function donutBackground(categories: DashboardData['report']['categories']) {
  if (categories.length === 0) return 'var(--border)';
  let position = 0;
  const segments = categories.map((category) => {
    const start = position;
    position += category.percentage;
    return `${category.color} ${start}% ${position}%`;
  });
  return `conic-gradient(${segments.join(', ')})`;
}

export function Dashboard({ categories, reloadKey }: DashboardProps) {
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BudgetProgress | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localReloadKey, setLocalReloadKey] = useState(0);

  const expenseCategories = categories.filter(
    (category) => category.kind === 'expense',
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboard(month, controller.signal)
      .then(setData)
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Dashboard data could not be loaded.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [month, reloadKey, localReloadKey]);

  const chartMaximum = useMemo(
    () =>
      Math.max(
        1,
        ...(data?.report.monthly.flatMap((item) => [
          Number(item.income),
          Number(item.expenses),
        ]) ?? []),
      ),
    [data],
  );

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setBudgetError(null);
    const form = new FormData(event.currentTarget);
    const input = {
      categoryId: String(form.get('categoryId') ?? ''),
      amount: String(form.get('amount') ?? ''),
      month,
    } satisfies BudgetInput;

    try {
      if (editing) await updateBudget(editing.id, input);
      else await createBudget(input);
      setEditing(null);
      event.currentTarget.reset();
      setIsLoading(true);
      setLocalReloadKey((current) => current + 1);
    } catch (saveError) {
      setBudgetError(
        saveError instanceof Error
          ? saveError.message
          : 'The budget could not be saved.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeBudget(budget: BudgetProgress) {
    if (!window.confirm(`Delete the ${budget.category.name} budget?`)) return;
    setBudgetError(null);
    try {
      await deleteBudget(budget.id);
      if (editing?.id === budget.id) setEditing(null);
      setIsLoading(true);
      setLocalReloadKey((current) => current + 1);
    } catch (deleteError) {
      setBudgetError(
        deleteError instanceof Error
          ? deleteError.message
          : 'The budget could not be deleted.',
      );
    }
  }

  return (
    <section
      className="dashboard-section"
      id="overview"
      aria-labelledby="dashboard-title"
    >
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Financial overview</p>
          <h1 id="dashboard-title">Your month at a glance</h1>
          <p>Track progress, spot trends and stay ahead of your spending.</p>
        </div>
        <label className="month-picker">
          <span>Reporting month</span>
          <input
            aria-label="Reporting month"
            onChange={(event) => {
              setIsLoading(true);
              setError(null);
              setMonth(event.target.value);
            }}
            type="month"
            value={month}
          />
        </label>
      </div>

      {error ? (
        <p className="load-error" role="alert">
          {error}
        </p>
      ) : null}
      {isLoading && !data ? (
        <div className="dashboard-loading">
          <span className="spinner" />
          Loading overview…
        </div>
      ) : null}

      {data ? (
        <>
          <div
            className="kpi-grid"
            aria-label={`${monthLabel(data.month)} summary`}
          >
            <article>
              <span>Current balance</span>
              <strong>{currency(data.summary.balance)}</strong>
              <small>Across active accounts</small>
            </article>
            <article>
              <span>Monthly income</span>
              <strong className="positive">
                +{currency(data.summary.income)}
              </strong>
              <small>{data.summary.transactionCount} transactions</small>
            </article>
            <article>
              <span>Monthly expenses</span>
              <strong>-{currency(data.summary.expenses)}</strong>
              <small>{monthLabel(data.month)}</small>
            </article>
            <article>
              <span>Savings rate</span>
              <strong
                className={
                  data.summary.savingsRate >= 0 ? 'positive' : 'negative'
                }
              >
                {data.summary.savingsRate.toFixed(1)}%
              </strong>
              <small>{currency(data.summary.savings)} saved</small>
            </article>
          </div>

          <div className="dashboard-grid">
            <section
              className="dashboard-card budget-card"
              aria-labelledby="budget-title"
            >
              <div className="dashboard-card-heading">
                <div>
                  <p className="eyebrow">Monthly plan</p>
                  <h2 id="budget-title">Category budgets</h2>
                </div>
                <span>{currency(data.budgets.remaining)} remaining</span>
              </div>

              <form
                className="budget-form"
                onSubmit={(event) => void saveBudget(event)}
              >
                <select
                  aria-label="Budget category"
                  defaultValue={editing?.category.id ?? ''}
                  key={editing?.id ?? 'new'}
                  name="categoryId"
                  required
                >
                  <option disabled value="">
                    Choose category
                  </option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Budget amount"
                  defaultValue={editing?.amount ?? ''}
                  key={`${editing?.id ?? 'new'}-amount`}
                  min="0.01"
                  name="amount"
                  placeholder="Amount"
                  required
                  step="0.01"
                  type="number"
                />
                <button
                  className="primary-button"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? 'Saving…' : editing ? 'Update' : 'Add budget'}
                </button>
                {editing ? (
                  <button
                    className="secondary-button"
                    onClick={() => setEditing(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                ) : null}
              </form>
              {budgetError ? (
                <p className="form-error" role="alert">
                  {budgetError}
                </p>
              ) : null}

              <div className="budget-list">
                {data.budgets.items.length === 0 ? (
                  <div className="compact-empty">
                    No budgets for {monthLabel(data.month)} yet.
                  </div>
                ) : (
                  data.budgets.items.map((budget) => (
                    <article key={budget.id} className="budget-row">
                      <div className="budget-row-heading">
                        <span
                          className="category-pill"
                          style={
                            {
                              '--category-color':
                                budget.category.color ?? '#94A3B8',
                            } as CSSProperties
                          }
                        >
                          {budget.category.name}
                          {budget.category.isArchived ? ' (archived)' : ''}
                        </span>
                        <strong>
                          {currency(budget.spent)} / {currency(budget.amount)}
                        </strong>
                      </div>
                      <div
                        className="budget-track"
                        aria-label={`${budget.percentage}% used`}
                      >
                        <span
                          className={budget.status}
                          style={{
                            width: `${Math.min(budget.percentage, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="budget-row-footer">
                        <small>
                          {budget.percentage.toFixed(1)}% used ·{' '}
                          {currency(budget.remaining)} left
                        </small>
                        <span>
                          {!budget.category.isArchived ? (
                            <button
                              onClick={() => setEditing(budget)}
                              type="button"
                            >
                              Edit
                            </button>
                          ) : null}
                          <button
                            className="danger-link"
                            onClick={() => void removeBudget(budget)}
                            type="button"
                          >
                            Delete
                          </button>
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section
              className="dashboard-card report-card"
              id="reports"
              aria-labelledby="trend-title"
            >
              <div className="dashboard-card-heading">
                <div>
                  <p className="eyebrow">Six-month report</p>
                  <h2 id="trend-title">Income vs spending</h2>
                </div>
              </div>
              <div
                className="trend-chart"
                aria-label="Six month income and expense chart"
              >
                {data.report.monthly.map((item) => (
                  <div className="trend-column" key={item.month}>
                    <div className="trend-bars">
                      <span
                        className="income-bar"
                        title={`${item.label} income ${currency(item.income)}`}
                        style={{
                          height: `${(Number(item.income) / chartMaximum) * 100}%`,
                        }}
                      />
                      <span
                        className="expense-bar"
                        title={`${item.label} expenses ${currency(item.expenses)}`}
                        style={{
                          height: `${(Number(item.expenses) / chartMaximum) * 100}%`,
                        }}
                      />
                    </div>
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span className="income-key">Income</span>
                <span className="expense-key">Expenses</span>
              </div>

              <div className="category-report">
                <div
                  className="spending-donut"
                  style={{
                    background: donutBackground(data.report.categories),
                  }}
                >
                  <span>
                    <strong>{currency(data.summary.expenses)}</strong>
                    <small>Total spent</small>
                  </span>
                </div>
                <div className="category-breakdown">
                  <h3>Spending by category</h3>
                  {data.report.categories.length === 0 ? (
                    <p className="muted">No expenses this month.</p>
                  ) : (
                    data.report.categories.map((category) => (
                      <div key={category.categoryId ?? category.name}>
                        <span>
                          <i style={{ background: category.color }} />
                          {category.name}
                        </span>
                        <strong>
                          {currency(category.amount)}{' '}
                          <small>{category.percentage.toFixed(1)}%</small>
                        </strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
