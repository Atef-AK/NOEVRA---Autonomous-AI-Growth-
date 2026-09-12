import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Members' };

export default function MembersPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">Manage who has access to your organization.</p>
        </div>
        <button id="invite-member-btn" className="btn btn--primary" disabled style={{ opacity: 0.6 }}>
          + Invite member
        </button>
      </div>

      <div className="card" style={{ padding: '48px', textAlign: 'center', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.12)' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>◎</div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>
          Member management
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
          Full member management UI is part of Phase 2. The API is already live at{' '}
          <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
            POST /api/v1/organizations/:id/members/invite
          </code>
        </p>
      </div>
    </div>
  );
}
