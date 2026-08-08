import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ThemeProvider, ThemeToggle } from './ThemeProvider';

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('switches theme and saves the preference', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const toggle = screen.getByRole('button', { name: 'Switch to dark mode' });
    await user.click(toggle);

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('savent-theme')).toBe('dark');
    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
