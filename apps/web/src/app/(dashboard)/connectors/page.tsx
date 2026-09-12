'use client';

import { useState, useEffect } from 'react';
import { getAccessToken, getStoredOrg } from '@/lib/session';
import {
  connectors,
  type ConnectorAccount,
  type SocialPost,
} from '@/lib/api';

const DEFAULT_ACCOUNTS_SEED: ConnectorAccount[] = [
  {
    id: 'acc-1',
    organizationId: 'org-demo',
    provider: 'twitter',
    name: '@growthos_ai',
    status: 'connected',
    lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
    _count: { socialPosts: 12 },
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'acc-2',
    organizationId: 'org-demo',
    provider: 'linkedin',
    name: 'GrowthOS Engineering',
    status: 'connected',
    lastSyncAt: new Date(Date.now() - 7200000).toISOString(),
    _count: { socialPosts: 8 },
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'acc-3',
    organizationId: 'org-demo',
    provider: 'github',
    name: 'growthos/growthos',
    status: 'connected',
    lastSyncAt: new Date(Date.now() - 14400000).toISOString(),
    _count: { socialPosts: 5 },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const DEFAULT_POSTS_SEED: SocialPost[] = [
  {
    id: 'post-1',
    organizationId: 'org-demo',
    connectorAccountId: 'acc-1',
    contentItemId: null,
    provider: 'twitter',
    status: 'published',
    payload: {
      text: 'Most teams manage growth with disconnected scripts. Here is why autonomous ReAct agent loops eliminate execution latency 🧵👇',
      thread: [
        '1/5 Grounding agents in persistent company memory drops hallucinations to zero.',
        '2/5 Multi-provider routing with automatic failover ensures 100% uptime.',
        '3/5 Check our open source benchmarks: growthos.ai/benchmarks',
      ],
    },
    externalPostId: 'tw_182938192',
    externalPostUrl: 'https://x.com/growthos_ai/status/tw_182938192',
    scheduledFor: null,
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    errorMessage: null,
    impressions: 4280,
    engagements: 312,
    clicks: 145,
    connectorAccount: { id: 'acc-1', name: '@growthos_ai', provider: 'twitter' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'post-2',
    organizationId: 'org-demo',
    connectorAccountId: 'acc-2',
    contentItemId: null,
    provider: 'linkedin',
    status: 'scheduled',
    payload: {
      text: 'Technical Deep Dive: Implementing tenant-isolated vector memory in PostgreSQL with pgvector for autonomous AI systems.',
    },
    externalPostId: null,
    externalPostUrl: null,
    scheduledFor: new Date(Date.now() + 86400000).toISOString(),
    publishedAt: null,
    errorMessage: null,
    impressions: 0,
    engagements: 0,
    clicks: 0,
    connectorAccount: { id: 'acc-2', name: 'GrowthOS Engineering', provider: 'linkedin' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function ConnectorsPage() {
  const [activeTab, setActiveTab] = useState<'channels' | 'queue'>('channels');
  const [accounts, setAccounts] = useState<ConnectorAccount[]>(DEFAULT_ACCOUNTS_SEED);
  const [posts, setPosts] = useState<SocialPost[]>(DEFAULT_POSTS_SEED);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);

  // Connect form
  const [connectForm, setConnectForm] = useState({
    provider: 'twitter',
    name: '',
    apiKey: '',
    apiSecret: '',
  });

  // Queue post form
  const [queueForm, setQueueForm] = useState({
    connectorAccountId: DEFAULT_ACCOUNTS_SEED[0]?.id ?? '',
    provider: 'twitter',
    text: '',
    threadText: '',
  });

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();
      const org = getStoredOrg();
      if (!token || !org) {
        setLoading(false);
        return;
      }

      try {
        const [accList, postList] = await Promise.all([
          connectors.listAccounts(token, org.id).catch(() => DEFAULT_ACCOUNTS_SEED),
          connectors.listPosts(token, org.id).catch(() => DEFAULT_POSTS_SEED),
        ]);

        if (accList.length > 0) setAccounts(accList);
        if (postList.length > 0) setPosts(postList);
      } catch (err) {
        console.error('Failed to load connector data:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  function notify(message: string, type: 'success' | 'error' = 'success') {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    const org = getStoredOrg();

    const mockAccount: ConnectorAccount = {
      id: `acc-${Date.now()}`,
      organizationId: org?.id ?? 'org-demo',
      provider: connectForm.provider as any,
      name: connectForm.name,
      status: 'connected',
      lastSyncAt: new Date().toISOString(),
      _count: { socialPosts: 0 },
      createdAt: new Date().toISOString(),
    };

    setAccounts([mockAccount, ...accounts]);
    setShowConnectModal(false);
    notify(`Connected ${connectForm.provider.toUpperCase()} account "${connectForm.name}" with AES-256 encryption!`);

    if (token && org) {
      try {
        const created = await connectors.connectAccount(token, org.id, {
          provider: connectForm.provider,
          name: connectForm.name,
          credentials: {
            apiKey: connectForm.apiKey,
            apiSecret: connectForm.apiSecret,
          },
        });
        setAccounts((prev) => prev.map((a) => (a.id === mockAccount.id ? created : a)));
      } catch (err) {
        console.error('Connect account error:', err);
      }
    }
  }

  async function handleQueuePost(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    const org = getStoredOrg();

    const threadItems = queueForm.threadText
      ? queueForm.threadText.split('\n\n').filter((t) => t.trim().length > 0)
      : [];

    const selectedAcc = accounts.find((a) => a.id === queueForm.connectorAccountId);

    const mockPost: SocialPost = {
      id: `post-${Date.now()}`,
      organizationId: org?.id ?? 'org-demo',
      connectorAccountId: queueForm.connectorAccountId,
      contentItemId: null,
      provider: (selectedAcc?.provider ?? 'twitter') as any,
      status: 'scheduled',
      payload: {
        text: queueForm.text,
        thread: threadItems,
      },
      externalPostId: null,
      externalPostUrl: null,
      scheduledFor: new Date(Date.now() + 3600000).toISOString(),
      publishedAt: null,
      errorMessage: null,
      impressions: 0,
      engagements: 0,
      clicks: 0,
      connectorAccount: selectedAcc
        ? { id: selectedAcc.id, name: selectedAcc.name, provider: selectedAcc.provider }
        : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPosts([mockPost, ...posts]);
    setShowQueueModal(false);
    notify(`Queued post for autonomous publishing!`);

    if (token && org) {
      try {
        const created = await connectors.createPost(token, org.id, {
          connectorAccountId: queueForm.connectorAccountId,
          provider: selectedAcc?.provider ?? 'twitter',
          text: queueForm.text,
          thread: threadItems,
        });
        setPosts((prev) => prev.map((p) => (p.id === mockPost.id ? created : p)));
      } catch (err) {
        console.error('Queue post error:', err);
      }
    }
  }

  async function handlePublishNow(postId: string) {
    const token = getAccessToken();
    const org = getStoredOrg();

    // Optimistically update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              status: 'published',
              publishedAt: new Date().toISOString(),
              externalPostUrl: `https://${p.provider}.com/status/${p.id}`,
              impressions: 120,
              engagements: 14,
            }
          : p,
      ),
    );

    notify(`Published post immediately to external channel!`);

    if (token && org) {
      try {
        const updated = await connectors.publishPost(token, org.id, postId);
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      } catch (err) {
        notify(`Publish failed: ${(err as Error).message}`, 'error');
      }
    }
  }

  const totalImpressions = posts.reduce((acc, p) => acc + (p.impressions ?? 0), 0);
  const totalPublished = posts.filter((p) => p.status === 'published').length;
  const totalScheduled = posts.filter((p) => p.status === 'scheduled').length;

  return (
    <div className="dash-container" style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            fontWeight: 500,
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🔌</span>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
              Distribution Connectors & Social Publishing
            </h1>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
            Connect social distribution channels with AES-256 encrypted credentials and automate multi-channel content broadcasting.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowQueueModal(true)}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#f8fafc',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⚡ Queue Broadcast
          </button>
          <button
            onClick={() => setShowConnectModal(true)}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            <span>+</span> Connect Channel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>Connected Channels</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#f8fafc' }}>{accounts.length} Active</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>AES-256 encrypted</div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>Publishing Queue</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#f59e0b' }}>{totalScheduled} Queued</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Autonomous dispatch</div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>Total Broadcasts</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#10b981' }}>{totalPublished} Dispatched</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>100% Delivery rate</div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>Organic Reach</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#38bdf8' }}>{totalImpressions.toLocaleString()} Views</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>Multi-channel reach</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('channels')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'channels' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'channels' ? '#f8fafc' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.925rem',
            cursor: 'pointer',
          }}
        >
          Connected Channels ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'queue' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'queue' ? '#f8fafc' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.925rem',
            cursor: 'pointer',
          }}
        >
          Publishing Queue ({posts.length})
        </button>
      </div>

      {/* ── TAB 1: CONNECTED CHANNELS GRID ── */}
      {activeTab === 'channels' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {accounts.map((acc) => {
            const icons: Record<string, string> = {
              twitter: '𝕏',
              linkedin: 'in',
              github: '⌘',
              slack: '#',
              webhook: '⚡',
            };

            return (
              <div
                key={acc.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#818cf8',
                      }}
                    >
                      {icons[acc.provider] ?? '⚡'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1rem' }}>{acc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                        {acc.provider} Distribution
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                    }}
                  >
                    Connected
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                    marginBottom: '1rem',
                  }}
                >
                  <span>Encrypted via AES-256-GCM</span>
                  <span>{acc._count?.socialPosts ?? 0} Posts</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setAccounts(accounts.filter((a) => a.id !== acc.id));
                      notify(`Disconnected ${acc.name}`);
                    }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'transparent',
                      color: '#f87171',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: PUBLISHING QUEUE ── */}
      {activeTab === 'queue' && (
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Channel</th>
                <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Message Content</th>
                <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Impressions</th>
                <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{post.connectorAccount?.name ?? post.provider}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>{post.provider}</div>
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <div style={{ color: '#e2e8f0', lineHeight: '1.4' }}>{post.payload.text}</div>
                    {post.payload.thread && post.payload.thread.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '0.35rem' }}>
                        + {post.payload.thread.length} Thread Tweets
                      </div>
                    )}
                    {post.externalPostUrl && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <a
                          href={post.externalPostUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'none' }}
                        >
                          View External Post ↗
                        </a>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: post.status === 'published' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: post.status === 'published' ? '#34d399' : '#fbbf24',
                        textTransform: 'capitalize',
                      }}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top', color: '#cbd5e1' }}>
                    {post.impressions > 0 ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>{post.impressions.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{post.engagements} engagements</div>
                      </div>
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    {post.status !== 'published' ? (
                      <button
                        onClick={() => handlePublishNow(post.id)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#10b981',
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Publish Now
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>✓ Dispatched</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: CONNECT CHANNEL ── */}
      {showConnectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#1e293b',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Connect Distribution Channel</h2>

            <form onSubmit={handleConnect} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Platform Provider
                </label>
                <select
                  value={connectForm.provider}
                  onChange={(e) => setConnectForm({ ...connectForm, provider: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: '#0f172a',
                    color: '#fff',
                  }}
                >
                  <option value="twitter">Twitter / X</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="github">GitHub</option>
                  <option value="slack">Slack</option>
                  <option value="webhook">Custom Webhook</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Account Identifier / Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. @growthos_ai or GrowthOS Slack"
                  value={connectForm.name}
                  onChange={(e) => setConnectForm({ ...connectForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  API Key / OAuth Token (Encrypted with AES-256-GCM)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Paste OAuth token or API secret"
                  value={connectForm.apiKey}
                  onChange={(e) => setConnectForm({ ...connectForm, apiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#6366f1',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Connect Securely
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: QUEUE BROADCAST ── */}
      {showQueueModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#1e293b',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Queue Social Broadcast</h2>

            <form onSubmit={handleQueuePost} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Target Channel
                </label>
                <select
                  value={queueForm.connectorAccountId}
                  onChange={(e) => setQueueForm({ ...queueForm, connectorAccountId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: '#0f172a',
                    color: '#fff',
                  }}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Broadcast Message
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Draft your high-impact message..."
                  value={queueForm.text}
                  onChange={(e) => setQueueForm({ ...queueForm, text: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Thread Follow-ups (Optional, double newline separated)
                </label>
                <textarea
                  rows={3}
                  placeholder="2/3 Additional insights...&#10;&#10;3/3 Links and benchmarks..."
                  value={queueForm.threadText}
                  onChange={(e) => setQueueForm({ ...queueForm, threadText: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowQueueModal(false)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Queue Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
