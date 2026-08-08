import type { AuthUser, LoginInput, RegisterInput } from '@savent/contracts';
import { useState, type FormEvent, type KeyboardEvent } from 'react';

import { login, register } from '../api/auth';
import { ThemeToggle } from './ThemeProvider';

type AuthPageProps = {
  onAuthenticated: (user: AuthUser) => void;
};

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');

    try {
      const user =
        mode === 'register'
          ? await register({
              name: String(form.get('name') ?? ''),
              email,
              password,
            } satisfies RegisterInput)
          : await login({ email, password } satisfies LoginInput);
      onAuthenticated(user);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Authentication could not be completed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError(null);
  }

  function handleTabKey(
    event: KeyboardEvent<HTMLButtonElement>,
    current: 'login' | 'register',
  ) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const nextMode = current === 'login' ? 'register' : 'login';
    changeMode(nextMode);
    document.getElementById(`${nextMode}-tab`)?.focus();
  }

  return (
    <main className="auth-shell" id="main-content">
      <a className="skip-link" href="#auth-title">
        Skip to sign in
      </a>
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      <section className="auth-story">
        <a className="brand auth-brand" href="/" aria-label="Savent home">
          <span className="brand-mark">S</span>
          <span>Savent</span>
        </a>
        <div>
          <p className="eyebrow">Your money, clearly</p>
          <h1>Know where every dollar goes.</h1>
          <p>
            A private workspace for tracking income, expenses and transfers
            without losing sight of the bigger picture.
          </p>
        </div>
        <ul aria-label="Savent benefits">
          <li>Private, user-isolated financial data</li>
          <li>Clear transaction search and filters</li>
          <li>Secure HTTP-only browser sessions</li>
        </ul>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">
          {mode === 'login' ? 'Welcome back' : 'Get started'}
        </p>
        <h2 id="auth-title">
          {mode === 'login' ? 'Sign in to Savent' : 'Create your workspace'}
        </h2>
        <p>
          {mode === 'login'
            ? 'Continue managing your personal finances.'
            : 'Start with private accounts and ready-to-use categories.'}
        </p>

        <div
          className="auth-tabs"
          role="tablist"
          aria-label="Authentication mode"
        >
          <button
            aria-controls="authentication-form"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            id="login-tab"
            onKeyDown={(event) => handleTabKey(event, 'login')}
            onClick={() => changeMode('login')}
            role="tab"
            tabIndex={mode === 'login' ? 0 : -1}
            type="button"
          >
            Sign in
          </button>
          <button
            aria-controls="authentication-form"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            id="register-tab"
            onKeyDown={(event) => handleTabKey(event, 'register')}
            onClick={() => changeMode('register')}
            role="tab"
            tabIndex={mode === 'register' ? 0 : -1}
            type="button"
          >
            Register
          </button>
        </div>

        <form
          aria-labelledby={`${mode}-tab`}
          className="auth-form"
          id="authentication-form"
          onSubmit={(event) => void handleSubmit(event)}
          role="tabpanel"
        >
          {mode === 'register' ? (
            <label>
              <span>Name</span>
              <input autoComplete="name" name="name" required minLength={2} />
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="primary-button auth-submit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        {mode === 'login' ? (
          <p className="demo-hint">
            Demo: <strong>demo@savent.app</strong> / <strong>Demo1234!</strong>
          </p>
        ) : null}
      </section>
    </main>
  );
}
