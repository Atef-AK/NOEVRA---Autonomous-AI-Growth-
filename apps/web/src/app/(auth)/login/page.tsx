'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { saveSession } from '@/lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await auth.login({ email, password });
      saveSession(result);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card animate-fade-in">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <span style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>G</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            GrowthOS
          </span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your GrowthOS account</p>

        <form className="auth-form" onSubmit={handleSubmit} id="login-form">
          <div className="input-group">
            <label className="label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              className={`input ${error ? 'input--error' : ''}`}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="label" htmlFor="login-password">Password</label>
              <Link
                href="/forgot-password"
                style={{ fontSize: '0.8125rem', color: 'var(--color-brand-3)' }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              className={`input ${error ? 'input--error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="input-error-msg" role="alert" aria-live="polite">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            className="btn btn--primary w-full"
            disabled={loading}
            style={{ justifyContent: 'center', height: '44px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    display: 'inline-block',
                  }}
                />
                Signing in…
              </span>
            ) : (
              'Sign in →'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--color-brand-3)', fontWeight: 600 }}>
            Create one free
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
