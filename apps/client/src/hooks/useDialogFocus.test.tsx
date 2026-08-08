import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { useDialogFocus } from './useDialogFocus';

function DialogHarness() {
  const [open, setOpen] = useState(false);
  const dialogRef = useDialogFocus(open, () => setOpen(false));
  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      {open ? (
        <section ref={dialogRef} role="dialog" tabIndex={-1}>
          <button>First action</button>
          <button>Last action</button>
        </section>
      ) : null}
    </>
  );
}

describe('useDialogFocus', () => {
  it('moves focus into the dialog and restores it after Escape', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'Open dialog' });

    await user.click(opener);
    expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
