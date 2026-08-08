import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '../api/auth';
import { AuthPage } from './AuthPage';

vi.mock('../api/auth');

describe('AuthPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('signs in and returns the authenticated user', async () => {
    const user = userEvent.setup();
    const onAuthenticated = vi.fn();
    vi.mocked(authApi.login).mockResolvedValue({
      id: '2ef02cc8-ecc3-4b35-a1f7-c66aad633b62',
      name: 'Ava Nguyen',
      email: 'demo@savent.app',
    });
    render(<AuthPage onAuthenticated={onAuthenticated} />);

    await user.type(screen.getByLabelText('Email'), 'demo@savent.app');
    await user.type(screen.getByLabelText('Password'), 'Demo1234!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'demo@savent.app',
      password: 'Demo1234!',
    });
    expect(onAuthenticated).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'demo@savent.app' }),
    );
  });

  it('switches to registration and submits a new account', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockResolvedValue({
      id: '91d93a95-fb1a-4f2b-9ac0-e2b388756132',
      name: 'Nandan',
      email: 'nandan@example.com',
    });
    render(<AuthPage onAuthenticated={vi.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Register' }));
    await user.type(screen.getByLabelText('Name'), 'Nandan');
    await user.type(screen.getByLabelText('Email'), 'nandan@example.com');
    await user.type(screen.getByLabelText('Password'), 'strong-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Nandan',
      email: 'nandan@example.com',
      password: 'strong-password',
    });
  });
});
