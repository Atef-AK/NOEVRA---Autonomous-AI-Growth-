import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <p className="page-subtitle">
          Each project represents one product or website you want GrowthOS to grow.
        </p>
      </div>

      {/* Empty state */}
      <div
        className="card"
        style={{
          padding: '64px 48px',
          textAlign: 'center',
          borderStyle: 'dashed',
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--gradient-brand-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 24px',
          }}
        >
          ⬡
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>
          No projects yet
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', maxWidth: '360px', margin: '0 auto 32px' }}>
          Add your first project to start tracking growth opportunities, running content campaigns, and monitoring keywords.
        </p>
        <button id="create-project-btn" className="btn btn--primary" disabled style={{ opacity: 0.6 }}>
          + New Project (coming in Phase 2)
        </button>
      </div>
    </div>
  );
}
