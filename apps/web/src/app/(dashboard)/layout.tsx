'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAccessToken, getStoredUser, getStoredOrg, clearSession } from '@/lib/session';
import { auth } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦', exact: true },
  { href: '/projects', label: 'Projects', icon: '⬡' },
  { href: '/members', label: 'Members', icon: '◎' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string | null; email: string } | null>(null);
  const [org, setOrg] = useState<{ name: string; slug: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const storedUser = getStoredUser();
    const storedOrg = getStoredOrg();
    if (storedUser) setUser(storedUser);
    if (storedOrg) setOrg(storedOrg);
  }, [router]);

  async function handleLogout() {
    const token = getAccessToken();
    if (token) {
      try { await auth.logout(token); } catch { /* ignore */ }
    }
    clearSession();
    router.replace('/login');
  }

  if (!mounted) return null;

  function getInitials(name: string | null | undefined, email: string): string {
    if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    return email[0]?.toUpperCase() ?? 'U';
  }

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }}>G</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9375rem', letterSpacing: '-0.02em' }}>
              GrowthOS
            </div>
            {org && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {org.name}
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="sidebar-section-label">Menu</span>
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="avatar avatar--sm">
              {user ? getInitials(user.name, user.email) : 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name ?? user?.email ?? 'User'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="btn btn--ghost btn--sm"
              title="Sign out"
              style={{ padding: '4px 8px', fontSize: '12px', flexShrink: 0 }}
            >
              ⇥
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="layout-main">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
              {NAV_ITEMS.find(i => i.exact ? pathname === i.href : pathname.startsWith(i.href))?.label ?? 'Dashboard'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge--brand" style={{ fontSize: '0.6875rem' }}>
              Phase 1 — Foundation
            </span>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
