'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { saveSession } from '@/lib/session';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await auth.register({ email, password, name });
      saveSession(result);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card animate-fade-in">
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <span style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>G</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            GrowthOS
          </span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">
          Start your autonomous growth journey. Free forever for solo founders.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} id="register-form">
          <div className="input-group">
            <label className="label" htmlFor="register-name">Your name</label>
            <input
              id="register-name"
              type="text"
              className="input"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              autoComplete="name"
            />
          </div>

          <div className="input-group">
            <label className="label" htmlFor="register-email">Work email</label>
            <input
              id="register-email"
              type="email"
              className={`input ${error ? 'input--error' : ''}`}
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label className="label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              className={`input ${error ? 'input--error' : ''}`}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          {error && (
            <div className="input-error-msg" role="alert" aria-live="polite">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            id="register-submit"
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
                Creating account…
              </span>
            ) : (
              'Create account →'
            )}
          </button>

          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            By creating an account, you agree to our{' '}
            <Link href="/terms" style={{ color: 'var(--color-brand-3)' }}>Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: 'var(--color-brand-3)' }}>Privacy Policy</Link>.
          </p>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-brand-3)', fontWeight: 600 }}>
            Sign in
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
