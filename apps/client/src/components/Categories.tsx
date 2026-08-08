import type {
  Category,
  CategoryIcon,
  CategoryKind,
  CreateCategoryInput,
} from '@savent/contracts';
import { useEffect, useState, type FormEvent } from 'react';

import {
  createCategory,
  fetchCategories,
  setCategoryArchived,
  updateCategory,
} from '../api/categories';
import { useNotifications } from './notification-context';

type CategoriesProps = {
  reloadKey: number;
  onChanged: () => void;
};

const icons: Array<{ value: CategoryIcon; label: string; symbol: string }> = [
  { value: 'tag', label: 'General', symbol: '◇' },
  { value: 'wallet', label: 'Money', symbol: '$' },
  { value: 'shopping-cart', label: 'Shopping', symbol: '🛒' },
  { value: 'utensils', label: 'Dining', symbol: '🍴' },
  { value: 'train', label: 'Transport', symbol: '↗' },
  { value: 'house', label: 'Home', symbol: '⌂' },
  { value: 'heart', label: 'Health', symbol: '♥' },
  { value: 'film', label: 'Entertainment', symbol: '▶' },
  { value: 'receipt', label: 'Bills', symbol: '▤' },
  { value: 'graduation-cap', label: 'Education', symbol: '◆' },
  { value: 'gift', label: 'Gifts', symbol: '✦' },
];

function iconSymbol(icon: CategoryIcon) {
  return icons.find((candidate) => candidate.value === icon)?.symbol ?? '◇';
}

function countLabel(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

type CategoryFormProps = {
  category: Category | null;
  onCancel: () => void;
  onSaved: (message: string) => void;
};

function CategoryForm({ category, onCancel, onSaved }: CategoryFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const common = {
      name: String(form.get('name') ?? '').trim(),
      color: String(form.get('color') ?? '#2563EB').toUpperCase(),
      icon: String(form.get('icon') ?? 'tag') as CategoryIcon,
    };
    setIsSaving(true);
    setError(null);
    try {
      if (category) await updateCategory(category.id, common);
      else {
        await createCategory({
          ...common,
          kind: String(form.get('kind') ?? 'expense') as CategoryKind,
        } satisfies CreateCategoryInput);
      }
      onSaved(category ? 'Category updated.' : 'Category added.');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The category could not be saved.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="category-form" onSubmit={(event) => void submit(event)}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">
            {category ? 'Edit category' : 'New category'}
          </p>
          <h2>{category ? category.name : 'Add a category'}</h2>
        </div>
      </div>
      <div className="form-grid">
        <label className="field field-wide">
          <span>Name</span>
          <input
            defaultValue={category?.name ?? ''}
            maxLength={80}
            name="name"
            required
          />
        </label>
        <label className="field">
          <span>Type</span>
          <select
            defaultValue={category?.kind ?? 'expense'}
            disabled={Boolean(category)}
            name="kind"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label className="field">
          <span>Colour</span>
          <input
            className="colour-input"
            defaultValue={category?.color ?? '#2563EB'}
            name="color"
            type="color"
          />
        </label>
        <label className="field field-wide">
          <span>Icon</span>
          <select defaultValue={category?.icon ?? 'tag'} name="icon">
            {icons.map((icon) => (
              <option key={icon.value} value={icon.value}>
                {icon.symbol} {icon.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="form-actions">
        {category ? (
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
          {isSaving ? 'Saving…' : category ? 'Save changes' : 'Add category'}
        </button>
      </div>
    </form>
  );
}

export function Categories({ reloadKey, onChanged }: CategoriesProps) {
  const { notify } = useNotifications();
  const [categories, setCategories] = useState<Category[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localReloadKey, setLocalReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(includeArchived, controller.signal)
      .then(setCategories)
      .catch((caught: unknown) => {
        if (!controller.signal.aborted)
          setError(
            caught instanceof Error
              ? caught.message
              : 'Could not load categories.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [includeArchived, localReloadKey, reloadKey]);

  function changed(message?: string) {
    setEditing(null);
    setError(null);
    setIsLoading(true);
    setLocalReloadKey((current) => current + 1);
    onChanged();
    if (message) notify(message);
  }

  async function toggleArchived(category: Category) {
    if (
      !category.isArchived &&
      !window.confirm(
        `Archive ${category.name}? Existing transactions and budgets will be preserved.`,
      )
    )
      return;
    setError(null);
    try {
      await setCategoryArchived(category.id, !category.isArchived);
      changed(
        category.isArchived ? 'Category restored.' : 'Category archived.',
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The category could not be updated.',
      );
    }
  }

  return (
    <section className="categories-section" id="categories">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Organise activity</p>
          <h2>Categories</h2>
          <p>
            Personalise how income and spending appear without losing history.
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
      <div className="categories-layout">
        <div className="category-manager-list" aria-live="polite">
          {isLoading ? (
            <div className="loading-state">
              <span className="spinner" aria-hidden="true" />
              Loading categories…
            </div>
          ) : (
            categories.map((category) => (
              <article
                className={`category-manager-card${category.isArchived ? ' archived' : ''}`}
                key={category.id}
              >
                <span
                  aria-hidden="true"
                  className="category-icon"
                  style={{ background: category.color }}
                >
                  {iconSymbol(category.icon)}
                </span>
                <div className="category-card-copy">
                  <div>
                    <h3>{category.name}</h3>
                    <span>
                      {category.kind}
                      {category.isSystem ? ' · starter' : ''}
                      {category.isArchived ? ' · archived' : ''}
                    </span>
                  </div>
                  <small>
                    {countLabel(category.transactionCount, 'transaction')} ·{' '}
                    {countLabel(category.budgetCount, 'budget')}
                  </small>
                </div>
                <div className="category-card-actions">
                  {!category.isSystem ? (
                    <button
                      className="secondary-button"
                      onClick={() => setEditing(category)}
                      type="button"
                    >
                      Edit
                    </button>
                  ) : null}
                  <button
                    className="secondary-button"
                    onClick={() => void toggleArchived(category)}
                    type="button"
                  >
                    {category.isArchived ? 'Restore' : 'Archive'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
        <aside className="panel category-form-panel">
          <CategoryForm
            key={editing?.id ?? 'new'}
            category={editing}
            onCancel={() => setEditing(null)}
            onSaved={changed}
          />
        </aside>
      </div>
    </section>
  );
}
