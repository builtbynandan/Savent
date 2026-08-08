import {
  type AccountSummary,
  type CategorySummary,
  type CreateTransactionInput,
  type Transaction,
  type TransactionType,
} from '@savent/contracts';
import { useId, useMemo, useState, type FormEvent } from 'react';

type TransactionFormProps = {
  accounts: AccountSummary[];
  categories: CategorySummary[];
  initialTransaction?: Transaction;
  onCancel?: () => void;
  onSubmit: (input: CreateTransactionInput) => Promise<void>;
};

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  accounts,
  categories,
  initialTransaction,
  onCancel,
  onSubmit,
}: TransactionFormProps) {
  const amountId = useId();
  const isEditing = Boolean(initialTransaction);
  const [type, setType] = useState<TransactionType>(
    initialTransaction?.type ?? 'expense',
  );
  const [description, setDescription] = useState(
    initialTransaction?.description ?? '',
  );
  const [amount, setAmount] = useState(initialTransaction?.amount ?? '');
  const [accountId, setAccountId] = useState(
    initialTransaction?.accountId ?? accounts[0]?.id ?? '',
  );
  const [destinationAccountId, setDestinationAccountId] = useState(
    initialTransaction?.destinationAccountId ?? '',
  );
  const [categoryId, setCategoryId] = useState(
    initialTransaction?.categoryId ?? '',
  );
  const [transactionDate, setTransactionDate] = useState(
    initialTransaction?.transactionDate.slice(0, 10) ?? currentDate(),
  );
  const [notes, setNotes] = useState(initialTransaction?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchingCategories = useMemo(
    () =>
      type === 'transfer'
        ? []
        : categories.filter((category) => category.kind === type),
    [categories, type],
  );
  const selectedAccountId = accountId || accounts[0]?.id || '';
  const availableDestinations = accounts.filter(
    (account) => account.id !== selectedAccountId,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const account = accounts.find(
      (candidate) => candidate.id === selectedAccountId,
    );

    if (!account) {
      setError('Select an account before saving.');
      return;
    }

    if (type === 'transfer' && !destinationAccountId) {
      setError('Select a destination account for this transfer.');
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
        destinationAccountId: type === 'transfer' ? destinationAccountId : null,
        categoryId: type === 'transfer' ? null : categoryId || null,
        notes: notes.trim() || null,
      });

      if (!isEditing) {
        setDescription('');
        setAmount('');
        setDestinationAccountId('');
        setCategoryId('');
        setNotes('');
      }
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
          <p className="eyebrow">
            {isEditing ? 'Update record' : 'Quick entry'}
          </p>
          <h2>{isEditing ? 'Edit transaction' : 'Add transaction'}</h2>
        </div>
        <span className="secure-label">Database-backed</span>
      </div>

      <fieldset className="type-switcher">
        <legend>Transaction type</legend>
        {(['expense', 'income', 'transfer'] as const).map((option) => (
          <label key={option}>
            <input
              checked={type === option}
              name={`type-${amountId}`}
              onChange={() => {
                setType(option);
                setCategoryId('');
                setDestinationAccountId('');
              }}
              type="radio"
              value={option}
            />
            <span>{option[0].toUpperCase() + option.slice(1)}</span>
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
          <label htmlFor={amountId}>Amount</label>
          <div className="money-input">
            <span>
              {accounts.find((account) => account.id === selectedAccountId)
                ?.currency ?? 'AUD'}
            </span>
            <input
              id={amountId}
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
          <span>{type === 'transfer' ? 'From account' : 'Account'}</span>
          <select
            onChange={(event) => {
              setAccountId(event.target.value);
              if (event.target.value === destinationAccountId) {
                setDestinationAccountId('');
              }
            }}
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

        {type === 'transfer' ? (
          <label className="field">
            <span>To account</span>
            <select
              onChange={(event) => setDestinationAccountId(event.target.value)}
              required
              value={destinationAccountId}
            >
              <option value="">Select destination</option>
              {availableDestinations.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
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
        )}

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

      <div className="form-actions">
        {onCancel ? (
          <button className="secondary-button" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
        <button
          className="primary-button"
          disabled={isSaving || accounts.length === 0}
          type="submit"
        >
          {isSaving
            ? 'Saving…'
            : isEditing
              ? 'Save changes'
              : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}
