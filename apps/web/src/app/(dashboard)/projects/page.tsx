'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAccessToken, getStoredOrg } from '@/lib/session';
import { projects, type Project } from '@/lib/api';

export default function ProjectsPage() {
  const router = useRouter();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Project modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    setError(null);
    const token = getAccessToken();
    const org = getStoredOrg();

    if (!token || !org?.id) {
      setLoading(false);
      return;
    }

    try {
      const data = await projects.list(token, org.id);
      setProjectList(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load projects';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    const token = getAccessToken();
    const org = getStoredOrg();

    if (!token || !org?.id) {
      setError('Session expired. Please log in again.');
      setCreating(false);
      return;
    }

    try {
      let finalUrl = websiteUrl.trim();
      if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }

      const created = await projects.create(token, org.id, {
        name: name.trim(),
        websiteUrl: finalUrl || undefined,
        description: description.trim() || undefined,
      });

      setProjectList([created, ...projectList]);
      setShowModal(false);
      setName('');
      setWebsiteUrl('');
      setDescription('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create project';
      setError(msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge--brand">✦ MULTI-PROJECT MANAGEMENT</span>
            <span className="badge badge--success">{projectList.length} Active</span>
          </div>
          <h1 className="page-title">Growth Projects</h1>
          <p className="page-subtitle">
            Each project represents a website or digital product managed by your autonomous AI growth agents.
          </p>
        </div>
        <button
          id="create-new-project-btn"
          className="btn btn--primary"
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>+</span> Add Project
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', marginBottom: '24px', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-secondary)' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 16px' }} />
          Loading growth projects...
        </div>
      ) : projectList.length === 0 ? (
        /* Empty state */
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
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', maxWidth: '380px', margin: '0 auto 32px' }}>
            Add your website to start tracking SEO keywords, deploying autonomous content swarms, and capturing high-intent leads.
          </p>
          <button
            id="empty-create-project-btn"
            className="btn btn--primary"
            onClick={() => setShowModal(true)}
          >
            + Create Your First Project
          </button>
        </div>
      ) : (
        /* Projects Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {projectList.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(99,102,241,0.15)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      🌐
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>{p.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Created {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="badge badge--success" style={{ textTransform: 'capitalize' }}>
                    {p.status || 'Active'}
                  </span>
                </div>

                {p.websiteUrl && (
                  <div style={{ marginBottom: '12px' }}>
                    <a
                      href={p.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.8125rem',
                        color: '#818cf8',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      🔗 {p.websiteUrl} ↗
                    </a>
                  </div>
                )}

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {p.description || 'Autonomous AI growth engine attached. Tracking SEO metrics, content velocity, and competitor positioning.'}
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>Autonomy Level:</span>
                  <span style={{ fontWeight: 600, color: '#a78bfa' }}>
                    ⚡ Level {p.autonomyLevel || 3} (Autonomous)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => router.push(`/dashboard`)}
                    style={{ justifyContent: 'center' }}
                  >
                    ⚡ Launch Swarm
                  </button>
                  <Link
                    href="/seo"
                    className="btn btn--secondary btn--sm"
                    style={{ justifyContent: 'center', textDecoration: 'none' }}
                  >
                    🔍 View SEO
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '500px', padding: '32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Add New Growth Project</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label className="label" htmlFor="project-name">Project / Brand Name *</label>
                <input
                  id="project-name"
                  className="input"
                  placeholder="e.g. Acme Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="label" htmlFor="project-url">Website URL</label>
                <input
                  id="project-url"
                  className="input"
                  type="url"
                  placeholder="https://acme.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label" htmlFor="project-desc">Description & Value Proposition</label>
                <textarea
                  id="project-desc"
                  className="input"
                  placeholder="Briefly describe what your product does and who your target audience is..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={creating || !name.trim()}
                >
                  {creating ? 'Saving...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
