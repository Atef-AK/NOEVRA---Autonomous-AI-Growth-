import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'GrowthOS dashboard — overview of your growth metrics',
};

const METRIC_CARDS = [
  {
    label: 'Organic Traffic',
    value: '—',
    delta: '+0%',
    positive: true,
    accent: 'brand',
    icon: '📈',
    description: 'Connect your GSC to track organic traffic',
  },
  {
    label: 'Content Published',
    value: '0',
    delta: 'This month',
    positive: true,
    accent: 'emerald',
    icon: '✍️',
    description: 'Articles published by GrowthOS AI',
  },
  {
    label: 'Keywords Tracked',
    value: '0',
    delta: 'Add a project to begin',
    positive: true,
    accent: 'amber',
    icon: '🔍',
    description: 'Keywords monitored in SERPs',
  },
  {
    label: 'Leads Generated',
    value: '—',
    delta: 'Integration required',
    positive: false,
    accent: 'rose',
    icon: '🎯',
    description: 'Connect your CRM to track leads',
  },
];

const QUICK_ACTIONS = [
  {
    title: 'Create your first project',
    description: 'Add your website and let GrowthOS analyze your growth opportunities.',
    href: '/projects',
    icon: '⬡',
    cta: 'Add project →',
  },
  {
    title: 'Invite your team',
    description: 'Collaborate with your growth team inside GrowthOS.',
    href: '/members',
    icon: '◎',
    cta: 'Invite members →',
  },
  {
    title: 'Connect integrations',
    description: 'Link Google Analytics, Search Console, and your CRM.',
    href: '/settings',
    icon: '⚡',
    cta: 'Connect now →',
  },
];

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Good morning 👋</h1>
        <p className="page-subtitle">
          Here&apos;s what&apos;s happening with your growth — connect your first project to see real data.
        </p>
      </div>

      {/* Metric cards */}
      <div className="metric-grid stagger-children">
        {METRIC_CARDS.map((card) => (
          <div
            key={card.label}
            className={`card metric-card metric-card--${card.accent}`}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span className="metric-label">{card.label}</span>
              <span style={{ fontSize: '20px' }}>{card.icon}</span>
            </div>
            <div className="metric-value">{card.value}</div>
            <div
              className={`metric-delta ${card.positive ? 'metric-delta--positive' : ''}`}
              style={!card.positive ? { color: 'var(--color-text-muted)' } : {}}
            >
              {card.delta}
            </div>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                marginTop: '8px',
                lineHeight: 1.4,
              }}
            >
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            marginBottom: '16px',
            letterSpacing: '-0.01em',
          }}
        >
          Get started
        </h2>

        <div
          className="stagger-children"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <a
              key={action.title}
              href={action.href}
              className="card card--interactive"
              style={{ padding: '24px', display: 'block', textDecoration: 'none' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--gradient-brand-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  marginBottom: '14px',
                }}
              >
                {action.icon}
              </div>
              <h3
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: 'var(--color-text-primary)',
                }}
              >
                {action.title}
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                }}
              >
                {action.description}
              </p>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-brand-3)',
                }}
              >
                {action.cta}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Status banner */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderColor: 'rgba(99,102,241,0.2)',
          background: 'rgba(99,102,241,0.05)',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--color-accent-emerald)',
            flexShrink: 0,
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Phase 1 — Foundation Complete.</strong>
          {' '}Database, API (auth, orgs, projects, members), and this dashboard are live.
          Phase 2 (AI content engine) is next.
        </span>
      </div>
    </div>
  );
}
