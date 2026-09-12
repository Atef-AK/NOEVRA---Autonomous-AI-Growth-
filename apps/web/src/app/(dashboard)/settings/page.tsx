import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

const INTEGRATIONS = [
  { name: 'Google Search Console', icon: '🔍', status: 'disconnected', phase: 2 },
  { name: 'Google Analytics 4', icon: '📊', status: 'disconnected', phase: 2 },
  { name: 'Semrush', icon: '📈', status: 'disconnected', phase: 3 },
  { name: 'Ahrefs', icon: '🔗', status: 'disconnected', phase: 3 },
  { name: 'Stripe', icon: '💳', status: 'disconnected', phase: 4 },
];

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your organization settings and integrations.</p>
      </div>

      {/* Integrations */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.01em' }}>
          Integrations
        </h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Integration</th>
                <th>Status</th>
                <th>Available</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {INTEGRATIONS.map((integration) => (
                <tr key={integration.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{integration.icon}</span>
                      <span style={{ fontWeight: 500 }}>{integration.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge--neutral">Disconnected</span>
                  </td>
                  <td>
                    <span className="badge badge--warning">Phase {integration.phase}</span>
                  </td>
                  <td>
                    <button className="btn btn--secondary btn--sm" disabled style={{ opacity: 0.5 }}>
                      Connect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Org settings placeholder */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
          Organization Settings
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
          Full settings management (org rename, logo upload, danger zone) will be part of Phase 2.
          The underlying API endpoints are already live and tested.
        </p>
      </div>
    </div>
  );
}
