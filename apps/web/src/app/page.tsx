import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'GrowthOS — Your Autonomous AI Growth Department',
  description:
    'GrowthOS acts as a full autonomous AI growth department for your company. SEO, content, analytics, ads, and community — all on autopilot.',
};

const features = [
  {
    icon: '🔍',
    title: 'Autonomous SEO',
    description: 'AI audits your site, finds opportunities, and publishes optimized content — end-to-end without human bottlenecks.',
    accent: '--color-brand-1',
  },
  {
    icon: '📊',
    title: 'Growth Analytics',
    description: 'Deep funnel analysis, competitive intelligence, and automated insights delivered to your dashboard daily.',
    accent: '--color-accent-emerald',
  },
  {
    icon: '✍️',
    title: 'AI Content Engine',
    description: 'High-quality blog posts, landing pages, and social content generated from your brand voice — not generic AI slop.',
    accent: '--color-accent-sky',
  },
  {
    icon: '🎯',
    title: 'Paid Ads Intelligence',
    description: 'Cross-channel ad performance monitoring with automatic optimization recommendations and budget reallocation.',
    accent: '--color-accent-amber',
  },
  {
    icon: '🤝',
    title: 'Community Growth',
    description: 'Monitor brand mentions, engage with your community, and identify influencer opportunities — automatically.',
    accent: '--color-brand-2',
  },
  {
    icon: '🔐',
    title: 'Enterprise Security',
    description: 'Multi-tenant isolation, role-based access control, audit logs, and SOC 2-ready infrastructure.',
    accent: '--color-accent-rose',
  },
];

const stats = [
  { value: '10x', label: 'Faster than hiring' },
  { value: '94%', label: 'Avg. traffic increase' },
  { value: '3.2x', label: 'ROI improvement' },
  { value: '<1hr', label: 'Time to first insight' },
];

export default function LandingPage() {
  return (
    <main>
      {/* ── Navbar ── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          height: '64px',
          background: 'rgba(5, 5, 16, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}
          >
            <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }}>G</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
            GrowthOS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/login" className="btn btn--ghost btn--sm">
            Sign in
          </Link>
          <Link href="/register" className="btn btn--primary btn--sm">
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 24px 64px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient orbs */}
        <div
          style={{
            position: 'absolute',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
            top: '-200px',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            bottom: '0',
            right: '10%',
            pointerEvents: 'none',
          }}
        />

        <div className="container container--narrow animate-fade-in">
          {/* Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <span className="badge badge--brand">
              <span>✦</span>
              Autonomous AI Growth — Phase 1 Live
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              marginBottom: '28px',
              background: 'linear-gradient(135deg, #f0f0ff 0%, #a78bfa 50%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your AI Growth Department.
            <br />
            Always On.
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              marginBottom: '48px',
              maxWidth: '560px',
              margin: '0 auto 48px',
            }}
          >
            GrowthOS autonomously runs your SEO, content, ads, and analytics.
            It learns your brand, executes campaigns, and reports results —
            without you needing to manage an agency.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '64px',
            }}
          >
            <Link href="/register" className="btn btn--primary btn--lg">
              Start for free →
            </Link>
            <Link href="#features" className="btn btn--secondary btn--lg">
              See how it works
            </Link>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              maxWidth: '640px',
              margin: '0 auto',
            }}
          >
            {stats.map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        id="features"
        style={{
          padding: '96px 24px',
          position: 'relative',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="badge badge--neutral" style={{ marginBottom: '16px', display: 'inline-flex' }}>
              CAPABILITIES
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: '16px',
              }}
            >
              Everything a growth team does.
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Without the headcount.
              </span>
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
              GrowthOS runs every growth function autonomously, from research to execution to reporting.
            </p>
          </div>

          <div
            className="stagger-children"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {features.map((feature) => (
              <div key={feature.title} className="card card--interactive" style={{ padding: '32px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `var(--gradient-brand-soft)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginBottom: '20px',
                  }}
                >
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '10px' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '96px 24px' }}>
        <div className="container container--narrow" style={{ textAlign: 'center' }}>
          <div
            className="card"
            style={{
              padding: '64px 48px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.08) 100%)',
              borderColor: 'rgba(99,102,241,0.25)',
              boxShadow: '0 0 80px rgba(99,102,241,0.15)',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: '16px',
              }}
            >
              Ready to grow on autopilot?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '40px', fontSize: '1.0625rem' }}>
              Join the waitlist. First 100 companies get 3 months free.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn btn--primary btn--lg">
                Create free account
              </Link>
              <Link href="/login" className="btn btn--secondary btn--lg">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '32px 24px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '0.875rem',
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <span>© 2026 GrowthOS. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '24px' }}>
              <Link href="/privacy" style={{ color: 'var(--color-text-muted)' }}>Privacy</Link>
              <Link href="/terms" style={{ color: 'var(--color-text-muted)' }}>Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
