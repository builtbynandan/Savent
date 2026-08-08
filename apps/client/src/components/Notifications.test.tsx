import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useNotifications } from './notification-context';
import { NotificationProvider } from './Notifications';

function NotificationTrigger() {
  const { notify } = useNotifications();
  return <button onClick={() => notify('Account added.')}>Notify</button>;
}

describe('NotificationProvider', () => {
  it('announces and dismisses a success notification', async () => {
    const user = userEvent.setup();
    render(
      <NotificationProvider>
        <NotificationTrigger />
      </NotificationProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByRole('status')).toHaveTextContent('Account added.');

    await user.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
