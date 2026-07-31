import {
  type AccountSummary,
  type CategorySummary,
  type CreateTransactionInput,
  type TransactionType,
} from '@savent/contracts';
import { useMemo, useState, type FormEvent } from 'react';

type TransactionFormProps = {
  accounts: AccountSummary[];
  categories: CategorySummary[];
  onSubmit: (input: CreateTransactionInput) => Promise<void>;
};

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  accounts,
  categories,
  onSubmit,
}: TransactionFormProps) {
  const [type, setType] =
    useState<Exclude<TransactionType, 'transfer'>>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState(currentDate());
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchingCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );
  const selectedAccountId = accountId || accounts[0]?.id || '';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const account =
      accounts.find((candidate) => candidate.id === selectedAccountId) ??
      accounts[0];

    if (!account) {
      setError('Select an account before saving.');
      return;
    }

    setIsSaving(true);

    try {
      await onSubmit({
        type,
        description,
        amount: Number(amount).toFixed(2),
        currency: account.currency,
        transactionDate: new Date(`${transactionDate}T12:00:00`).toISOString(),
        accountId: account.id,
        destinationAccountId: null,
        categoryId: categoryId || null,
        notes: notes.trim() || null,
      });

      setDescription('');
      setAmount('');
      setCategoryId('');
      setNotes('');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'The transaction could not be saved.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Quick entry</p>
          <h2>Add transaction</h2>
        </div>
        <span className="secure-label">Saved locally</span>
      </div>

      <fieldset className="type-switcher">
        <legend>Transaction type</legend>
        {(['expense', 'income'] as const).map((option) => (
          <label key={option}>
            <input
              checked={type === option}
              name="type"
              onChange={() => {
                setType(option);
                setCategoryId('');
              }}
              type="radio"
              value={option}
            />
            <span>{option === 'expense' ? 'Expense' : 'Income'}</span>
          </label>
        ))}
      </fieldset>

      <div className="form-grid">
        <label className="field field-wide">
          <span>Description</span>
          <input
            autoComplete="off"
            maxLength={120}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="e.g. Weekly groceries"
            required
            value={description}
          />
        </label>

        <div className="field">
          <label htmlFor="transaction-amount">Amount</label>
          <div className="money-input">
            <span>
              {accounts.find((account) => account.id === selectedAccountId)
                ?.currency ?? 'AUD'}
            </span>
            <input
              id="transaction-amount"
              inputMode="decimal"
              min="0.01"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              required
              step="0.01"
              type="number"
              value={amount}
            />
          </div>
        </div>

        <label className="field">
          <span>Date</span>
          <input
            onChange={(event) => setTransactionDate(event.target.value)}
            required
            type="date"
            value={transactionDate}
          />
        </label>

        <label className="field">
          <span>Account</span>
          <select
            onChange={(event) => setAccountId(event.target.value)}
            required
            value={selectedAccountId}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Category</span>
          <select
            onChange={(event) => setCategoryId(event.target.value)}
            value={categoryId}
          >
            <option value="">Uncategorised</option>
            {matchingCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field field-wide">
          <span>Notes</span>
          <textarea
            maxLength={500}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional details"
            rows={3}
            value={notes}
          />
        </label>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="primary-button"
        disabled={isSaving || accounts.length === 0}
        type="submit"
      >
        {isSaving ? 'Saving…' : 'Add transaction'}
      </button>
    </form>
  );
}
