import type {
  Account,
  AccountType,
  CreateAccountInput,
} from '@savent/contracts';
import { useEffect, useState, type FormEvent } from 'react';

import {
  createAccount,
  fetchAccounts,
  setAccountArchived,
  updateAccount,
} from '../api/accounts';

type AccountsProps = {
  reloadKey: number;
  onChanged: () => void;
};

const accountTypes: Array<{ value: AccountType; label: string }> = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Credit card' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
];

function formatMoney(account: Account, value: string) {
  return Number(value).toLocaleString('en-AU', {
    style: 'currency',
    currency: account.currency,
  });
}

type AccountFormProps = {
  account: Account | null;
  onCancel: () => void;
  onSaved: () => void;
};

function AccountForm({ account, onCancel, onSaved }: AccountFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: CreateAccountInput = {
      name: String(form.get('name') ?? '').trim(),
      type: String(form.get('type') ?? 'checking') as AccountType,
      currency: 'AUD',
      openingBalance: String(form.get('openingBalance') ?? '').trim(),
    };
    setIsSaving(true);
    setError(null);
    try {
      if (account) await updateAccount(account.id, input);
      else await createAccount(input);
      onSaved();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The account could not be saved.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="account-form" onSubmit={(event) => void submit(event)}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">{account ? 'Edit account' : 'New account'}</p>
          <h2>{account ? account.name : 'Add an account'}</h2>
        </div>
      </div>
      <div className="form-grid">
        <label className="field field-wide">
          <span>Name</span>
          <input
            defaultValue={account?.name ?? ''}
            maxLength={80}
            name="name"
            required
          />
        </label>
        <label className="field">
          <span>Type</span>
          <select defaultValue={account?.type ?? 'checking'} name="type">
            {accountTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Currency</span>
          <input
            defaultValue={account?.currency ?? 'AUD'}
            name="currency"
            readOnly
          />
          <small>AUD only until currency conversion is available.</small>
        </label>
        <label className="field field-wide">
          <span>Opening balance</span>
          <input
            defaultValue={account?.openingBalance ?? '0.00'}
            inputMode="decimal"
            name="openingBalance"
            pattern="-?(0|[1-9][0-9]*)(\.[0-9]{1,2})?"
            required
          />
        </label>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="form-actions">
        {account ? (
          <button
            className="secondary-button"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        ) : null}
        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? 'Saving…' : account ? 'Save changes' : 'Add account'}
        </button>
      </div>
    </form>
  );
}

export function Accounts({ reloadKey, onChanged }: AccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localReloadKey, setLocalReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchAccounts(includeArchived, controller.signal)
      .then(setAccounts)
      .catch((caught: unknown) => {
        if (!controller.signal.aborted)
          setError(
            caught instanceof Error
              ? caught.message
              : 'Could not load accounts.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [includeArchived, localReloadKey, reloadKey]);

  function changed() {
    setEditing(null);
    setError(null);
    setIsLoading(true);
    setLocalReloadKey((current) => current + 1);
    onChanged();
  }

  async function toggleArchived(account: Account) {
    const action = account.isArchived ? 'restore' : 'archive';
    if (
      !account.isArchived &&
      !window.confirm(
        `Archive ${account.name}? Existing transactions will be preserved.`,
      )
    )
      return;
    setError(null);
    try {
      await setAccountArchived(account.id, !account.isArchived);
      changed();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Could not ${action} the account.`,
      );
    }
  }

  return (
    <section className="accounts-section" id="accounts">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your money</p>
          <h2>Accounts</h2>
          <p>
            Track each balance and keep transaction history when an account
            closes.
          </p>
        </div>
        <label className="archive-toggle">
          <input
            checked={includeArchived}
            onChange={(event) => {
              setIsLoading(true);
              setIncludeArchived(event.target.checked);
            }}
            type="checkbox"
          />{' '}
          Show archived
        </label>
      </div>
      {error ? (
        <p className="load-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="accounts-layout">
        <div className="account-list" aria-live="polite">
          {isLoading ? (
            <div className="loading-state">
              <span className="spinner" aria-hidden="true" />
              Loading accounts…
            </div>
          ) : (
            accounts.map((account) => (
              <article
                className={`account-card${account.isArchived ? ' archived' : ''}`}
                key={account.id}
              >
                <div className="account-card-top">
                  <span className="account-type">
                    {account.type.replace('_', ' ')}
                  </span>
                  {account.isArchived ? (
                    <span className="archived-label">Archived</span>
                  ) : null}
                </div>
                <h3>{account.name}</h3>
                <strong>{formatMoney(account, account.balance)}</strong>
                <small>
                  Opening balance {formatMoney(account, account.openingBalance)}
                </small>
                <div className="account-actions">
                  <button
                    className="secondary-button"
                    onClick={() => setEditing(account)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => void toggleArchived(account)}
                    type="button"
                  >
                    {account.isArchived ? 'Restore' : 'Archive'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
        <aside className="panel account-form-panel">
          <AccountForm
            key={editing?.id ?? 'new'}
            account={editing}
            onCancel={() => setEditing(null)}
            onSaved={changed}
          />
        </aside>
      </div>
    </section>
  );
}
