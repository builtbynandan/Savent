import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as categoriesApi from '../api/categories';
import { Categories } from './Categories';

vi.mock('../api/categories');

const category = {
  id: '3478ce12-0f3e-49b3-b520-4640fb65eeb2',
  name: 'Groceries',
  kind: 'expense' as const,
  color: '#EA580C',
  icon: 'shopping-cart' as const,
  isSystem: true,
  isArchived: false,
  transactionCount: 4,
  budgetCount: 1,
  createdAt: '2026-08-08T00:00:00.000Z',
  updatedAt: '2026-08-08T00:00:00.000Z',
};

describe('Categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoriesApi.fetchCategories).mockResolvedValue([category]);
    vi.mocked(categoriesApi.createCategory).mockResolvedValue({
      ...category,
      id: 'fd0716db-7b75-4a03-afb4-0492420b68dc',
      name: 'Health',
      icon: 'heart',
      isSystem: false,
      transactionCount: 0,
      budgetCount: 0,
    });
  });

  it('shows category usage and creates a custom category', async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    render(<Categories reloadKey={0} onChanged={onChanged} />);

    expect(
      await screen.findByText('4 transactions · 1 budget'),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('Name'), 'Health');
    await user.selectOptions(screen.getByLabelText('Icon'), 'heart');
    await user.click(screen.getByRole('button', { name: 'Add category' }));

    expect(categoriesApi.createCategory).toHaveBeenCalledWith({
      name: 'Health',
      kind: 'expense',
      color: '#2563EB',
      icon: 'heart',
    });
    expect(onChanged).toHaveBeenCalledOnce();
  });
});
