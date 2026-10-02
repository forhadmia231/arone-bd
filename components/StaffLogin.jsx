'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StaffLogin() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sign in failed.');
      }

      if (!['ADMIN', 'STAFF'].includes(data.user?.role)) {
        throw new Error('This account does not have staff access.');
      }

      window.dispatchEvent(new Event('paaikar-auth-change'));

      router.push(
        data.user.role === 'ADMIN'
          ? '/admin'
          : '/admin/products'
      );

      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container section account-page">
      <div className="auth-wrap">
        <div className="auth-intro">
          <span className="eyebrow">
            ARONE BD · STORE MANAGEMENT
          </span>

          <h1>Staff Sign In</h1>

          <p>
            Sign in with an administrator or approved staff account.
          </p>

          <p>
            <Link className="text-link" href="/">
              ← Back to Store
            </Link>
          </p>
        </div>

        <div className="panel auth-panel">
          <h2>Back-office Account</h2>

          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}

            <button
              className="btn btn-primary full"
              disabled={busy}
            >
              {busy ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="tiny-muted">
            Staff accounts are created by the Super Admin from Settings.
          </p>
        </div>
      </div>
    </main>
  );
}
