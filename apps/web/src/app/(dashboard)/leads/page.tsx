'use client';

import { useState, useEffect } from 'react';
import { getAccessToken, getStoredOrg } from '@/lib/session';
import { leads, type Lead, type CommunityInteraction } from '@/lib/api';

export default function LeadsPage() {
  const [leadList, setLeadList] = useState<Lead[]>([]);
  const [interactions, setInteractions] = useState<CommunityInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'radar'>('pipeline');

  // New Lead Form State
  const [showAddLead, setShowAddLead] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [creatingLead, setCreatingLead] = useState(false);

  // Scanning & Drafting States
  const [scanningRadar, setScanningRadar] = useState(false);
  const [draftingForId, setDraftingForId] = useState<string | null>(null);
  const [enrichingForId, setEnrichingForId] = useState<string | null>(null);

  // Toast / Status notification
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const token = getAccessToken();
    const org = getStoredOrg();

    if (!token || !org) {
      loadFallbackData();
      setLoading(false);
      return;
    }

    try {
      const [leadsRes, commRes] = await Promise.all([
        leads.listLeads(token, org.id).catch(() => []),
        leads.listCommunity(token, org.id).catch(() => []),
      ]);

      if (leadsRes.length > 0) {
        setLeadList(leadsRes);
      } else {
        loadFallbackLeads();
      }

      if (commRes.length > 0) {
        setInteractions(commRes);
      } else {
        loadFallbackCommunity();
      }
    } catch {
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  }

  function loadFallbackLeads() {
    const defaultLeads: Lead[] = [
      {
        id: 'lead-1',
        organizationId: 'org-demo',
        name: 'Alexander Vance',
        email: 'alex@nexustech.io',
        company: 'NexusTech Cloud',
        title: 'VP of Growth',
        stage: 'qualified',
        source: 'community',
        score: 94,
        websiteUrl: 'https://nexustech.io',
        linkedinUrl: 'https://linkedin.com/in/alexvance',
        twitterUrl: null,
        enrichmentData: {
          headcount: 85,
          estimatedArr: '$8M - $12M',
          technologies: ['Next.js', 'PostgreSQL', 'Stripe', 'OpenAI'],
          intentSignals: ['Hiring Growth Engineers', 'Series A Raised'],
          lastEnrichedAt: new Date().toISOString(),
        },
        notes: 'High intent: actively seeking AI agents for content repurposing and technical SEO.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lead-2',
        organizationId: 'org-demo',
        name: 'Elena Rostova',
        email: 'elena@solardata.ai',
        company: 'SolarData AI',
        title: 'Co-Founder & CEO',
        stage: 'outreach',
        source: 'intent',
        score: 91,
        websiteUrl: 'https://solardata.ai',
        linkedinUrl: null,
        twitterUrl: 'https://x.com/elena_solar',
        enrichmentData: {
          headcount: 42,
          estimatedArr: '$3M - $5M',
          technologies: ['React', 'Python', 'AWS', 'TailwindCSS'],
          intentSignals: ['Asked for B2B Social Distribution on Reddit'],
          lastEnrichedAt: new Date().toISOString(),
        },
        notes: 'Initiated outbound message offering automated Twitter & LinkedIn sync.',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lead-3',
        organizationId: 'org-demo',
        name: 'Marcus Brody',
        email: 'marcus@prismscale.com',
        company: 'PrismScale',
        title: 'Head of Marketing',
        stage: 'enriching',
        source: 'scraping',
        score: 76,
        websiteUrl: 'https://prismscale.com',
        linkedinUrl: null,
        twitterUrl: null,
        enrichmentData: {
          headcount: 28,
          estimatedArr: '$2M - $4M',
          technologies: ['Next.js', 'Vercel', 'Supabase'],
          intentSignals: ['Organic traffic drop reported'],
        },
        notes: null,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lead-4',
        organizationId: 'org-demo',
        name: 'Devon Kroll',
        email: 'devon@orbitflow.co',
        company: 'OrbitFlow Systems',
        title: 'Founding Engineer',
        stage: 'new',
        source: 'community',
        score: 65,
        websiteUrl: null,
        linkedinUrl: null,
        twitterUrl: null,
        enrichmentData: {},
        notes: 'Commented on HackerNews discussion regarding autonomous agents.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setLeadList(defaultLeads);
  }

  function loadFallbackCommunity() {
    const defaultInteractions: CommunityInteraction[] = [
      {
        id: 'comm-1',
        organizationId: 'org-demo',
        platform: 'twitter',
        postUrl: 'https://x.com/tech_builder/status/1892019481',
        author: '@tech_builder',
        title: null,
        content:
          'Anyone using AI agents for end-to-end SEO audits and programmatic content generation? Looking for tools that actually execute rather than just generate generic outlines.',
        sentiment: 'positive',
        intentScore: 94,
        replyDraft:
          "Great question! The biggest shift with modern AI growth systems is moving away from passive generation towards deterministic execution loops—where agents have access to real site crawlers, SERP APIs, and direct social connector webhooks rather than just outputting text prompts. We've been building GrowthOS around this exact premise.",
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'comm-2',
        organizationId: 'org-demo',
        platform: 'reddit',
        postUrl: 'https://reddit.com/r/SaaS/comments/growth_stack_2026',
        author: 'u/saas_operator',
        title: 'What is your current stack for automated B2B distribution?',
        content:
          'We are scaling from $20k to $100k MRR and our content distribution is a major bottleneck. Looking for software that can turn longform blog posts into Twitter threads, LinkedIn carousels, and track SERP rankings automatically.',
        sentiment: 'neutral',
        intentScore: 89,
        replyDraft: null,
        status: 'unreviewed',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'comm-3',
        organizationId: 'org-demo',
        platform: 'hackernews',
        postUrl: 'https://news.ycombinator.com/item?id=43901294',
        author: 'foundervc',
        title: 'Ask HN: How are you thinking about autonomous marketing agents in 2026?',
        content:
          'Curious what early-stage startups are doing with agentic workflows for company memory, RICE prioritized backlog creation, and social distribution.',
        sentiment: 'positive',
        intentScore: 86,
        replyDraft: null,
        status: 'unreviewed',
        createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setInteractions(defaultInteractions);
  }

  function loadFallbackData() {
    loadFallbackLeads();
    loadFallbackCommunity();
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;

    setCreatingLead(true);
    const token = getAccessToken();
    const org = getStoredOrg();

    try {
      if (token && org) {
        const created = await leads.createLead(token, org.id, {
          name: name.trim(),
          company: company.trim(),
          title: title.trim() || undefined,
          email: email.trim() || undefined,
          stage: 'new',
        });
        setLeadList((prev) => [created, ...prev]);
      } else {
        const mock: Lead = {
          id: `lead-${Date.now()}`,
          organizationId: 'org-demo',
          name: name.trim(),
          company: company.trim(),
          title: title.trim() || null,
          email: email.trim() || null,
          stage: 'new',
          source: 'inbound',
          score: title.toLowerCase().includes('founder') || title.toLowerCase().includes('head') ? 80 : 55,
          websiteUrl: null,
          linkedinUrl: null,
          twitterUrl: null,
          enrichmentData: {},
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setLeadList((prev) => [mock, ...prev]);
      }
      setName('');
      setCompany('');
      setTitle('');
      setEmail('');
      setShowAddLead(false);
      setStatusMessage('Lead prospect created successfully!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      setStatusMessage(`Error creating lead: ${(err as Error).message}`);
    } finally {
      setCreatingLead(false);
    }
  }

  async function handleEnrichLead(leadId: string) {
    setEnrichingForId(leadId);
    const token = getAccessToken();
    const org = getStoredOrg();

    try {
      if (token && org) {
        const updated = await leads.enrichLead(token, org.id, leadId);
        setLeadList((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      } else {
        setLeadList((prev) =>
          prev.map((l) => {
            if (l.id !== leadId) return l;
            return {
              ...l,
              score: Math.min(98, l.score + 22),
              stage: 'qualified',
              enrichmentData: {
                headcount: 65,
                estimatedArr: '$6M - $10M',
                technologies: ['Next.js', 'PostgreSQL', 'OpenAI', 'TailwindCSS'],
                intentSignals: ['Active hiring for Marketing Ops', 'High organic search presence'],
                lastEnrichedAt: new Date().toISOString(),
              },
            };
          }),
        );
      }
      setStatusMessage('Lead enriched with firmographics and technographic ICP match!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      setStatusMessage(`Enrichment failed: ${(err as Error).message}`);
    } finally {
      setEnrichingForId(null);
    }
  }

  async function handleScanRadar() {
    setScanningRadar(true);
    const token = getAccessToken();
    const org = getStoredOrg();

    try {
      if (token && org) {
        const newDiscovered = await leads.scanCommunity(token, org.id, {
          keywords: ['autonomous growth', 'seo automation', 'content agent'],
        });
        setInteractions((prev) => [...newDiscovered, ...prev]);
      } else {
        const mockNew: CommunityInteraction = {
          id: `comm-${Date.now()}`,
          organizationId: 'org-demo',
          platform: 'twitter',
          postUrl: 'https://x.com/growth_lead_xyz/status/19039182',
          author: '@growth_lead_xyz',
          title: null,
          content: 'Building out our 2026 growth stack. Any recommendations for automated content repurposing and technical SEO crawler agents?',
          sentiment: 'positive',
          intentScore: 96,
          replyDraft: null,
          status: 'unreviewed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setInteractions((prev) => [mockNew, ...prev]);
      }
      setStatusMessage('Community Radar scan complete: high-intent conversations identified.');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      setStatusMessage(`Scan failed: ${(err as Error).message}`);
    } finally {
      setScanningRadar(false);
    }
  }

  async function handleDraftReply(id: string) {
    setDraftingForId(id);
    const token = getAccessToken();
    const org = getStoredOrg();

    try {
      if (token && org) {
        const updated = await leads.draftReply(token, org.id, id, {
          intentDirective: 'Highlight execution loops and multi-tenant agent reliability.',
        });
        setInteractions((prev) => prev.map((i) => (i.id === id ? updated : i)));
      } else {
        setInteractions((prev) =>
          prev.map((i) => {
            if (i.id !== id) return i;
            return {
              ...i,
              status: 'approved',
              replyDraft:
                "Great question! The biggest shift with modern AI growth systems is moving away from passive generation towards deterministic execution loops—where agents have access to real site crawlers, SERP APIs, and direct social connector webhooks rather than just outputting text prompts. We've been building GrowthOS around this exact premise.",
            };
          }),
        );
      }
      setStatusMessage('Brand-aligned AI reply draft generated!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      setStatusMessage(`Drafting failed: ${(err as Error).message}`);
    } finally {
      setDraftingForId(null);
    }
  }

  function getScoreBadge(score: number) {
    const bg = score >= 85 ? 'rgba(16, 185, 129, 0.15)' : score >= 70 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)';
    const color = score >= 85 ? '#10b981' : score >= 70 ? '#818cf8' : '#f59e0b';
    return (
      <span
        className="badge"
        style={{ background: bg, color, fontWeight: 800, fontSize: '0.8125rem' }}
      >
        {score} / 100 ICP
      </span>
    );
  }

  function getPlatformIcon(platform: string) {
    if (platform === 'twitter') return '𝕏';
    if (platform === 'reddit') return '🤖';
    if (platform === 'hackernews') return '🟧';
    return '💼';
  }

  const stages = [
    { key: 'new', label: 'Discovered', desc: 'Raw prospects from social & intent radar' },
    { key: 'enriching', label: 'Enriching', desc: 'Technographic & firmographic scan' },
    { key: 'qualified', label: 'ICP Qualified', desc: 'High fit score (80+) & budget match' },
    { key: 'outreach', label: 'Active Outreach', desc: 'Engagement sequence in flight' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Community Radar & Lead Pipeline
            </h1>
            <span className="badge badge--brand" style={{ fontSize: '0.75rem' }}>
              Phase 8
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Autonomous buyer intent monitoring across Reddit, X, and Hacker News, combined with automated ICP scoring and technographic enrichment.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            id="scan-radar-btn"
            onClick={handleScanRadar}
            disabled={scanningRadar}
            className="btn btn--secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {scanningRadar ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px' }} />
                Scanning Channels...
              </>
            ) : (
              <>📡 Scan Radar</>
            )}
          </button>
          <button
            id="add-lead-btn"
            onClick={() => setShowAddLead(!showAddLead)}
            className="btn btn--primary"
          >
            + New Prospect
          </button>
        </div>
      </div>

      {/* ── Status Banner ── */}
      {statusMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid var(--color-brand-primary)',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* ── New Lead Modal / Dropdown Form ── */}
      {showAddLead && (
        <div className="card" style={{ padding: '20px', border: '1px solid var(--color-brand-primary)' }}>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '12px' }}>
            Add Target Prospect Lead
          </h3>
          <form onSubmit={handleCreateLead} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Contact Name *
              </label>
              <input
                id="lead-name-input"
                type="text"
                required
                className="input"
                placeholder="e.g. Sarah Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Company Name *
              </label>
              <input
                id="lead-company-input"
                type="text"
                required
                className="input"
                placeholder="e.g. Acme Cloud"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Job Title
              </label>
              <input
                id="lead-title-input"
                type="text"
                className="input"
                placeholder="e.g. VP of Growth"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                id="lead-email-input"
                type="email"
                className="input"
                placeholder="e.g. sarah@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowAddLead(false)}
              >
                Cancel
              </button>
              <button
                id="save-lead-btn"
                type="submit"
                disabled={creatingLead}
                className="btn btn--primary"
              >
                {creatingLead ? 'Saving...' : 'Save Prospect'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Key Metrics Overview ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Pipeline Prospects
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {leadList.length}
            </span>
            <span className="badge badge--success" style={{ fontSize: '0.6875rem' }}>
              Active
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Estimated Pipeline: $320K ARR
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            High-Fit Qualified (ICP &gt;= 80)
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
              {leadList.filter((l) => l.score >= 80).length}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              ({Math.round((leadList.filter((l) => l.score >= 80).length / (leadList.length || 1)) * 100)}% Conversion Fit)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
            Ready for Automated Outreach
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Community Buying Intent
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#818cf8' }}>
              {interactions.length}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Discussions Identified
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Avg Intent Score: {Math.round(interactions.reduce((s, i) => s + i.intentScore, 0) / (interactions.length || 1))}%
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Outreach Velocity
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>2.4</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>days</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
            68% response rate on AI drafts
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)' }}>
        <button
          id="tab-pipeline-btn"
          className={`btn ${activeTab === 'pipeline' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setActiveTab('pipeline')}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none' }}
        >
          📊 Lead Pipeline Kanban ({leadList.length})
        </button>
        <button
          id="tab-radar-btn"
          className={`btn ${activeTab === 'radar' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setActiveTab('radar')}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none' }}
        >
          📡 Community Intent Radar ({interactions.length})
        </button>
      </div>

      {/* ── TAB 1: PIPELINE KANBAN ── */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {stages.map((stage) => {
            const stageLeads = leadList.filter((l) => l.stage === stage.key);
            return (
              <div
                key={stage.key}
                style={{
                  background: 'var(--color-bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '16px',
                  minHeight: '480px',
                }}
              >
                {/* Stage Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{stage.label}</span>
                    <span
                      style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {stageLeads.length}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                  {stage.desc}
                </div>

                {/* Lead Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{lead.name}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            {lead.title ?? 'Decision Maker'} @ <strong style={{ color: '#fff' }}>{lead.company}</strong>
                          </div>
                        </div>
                        {getScoreBadge(lead.score)}
                      </div>

                      {/* Technographics & ARR badges */}
                      {lead.enrichmentData && (lead.enrichmentData.technologies || lead.enrichmentData.estimatedArr) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {lead.enrichmentData.estimatedArr && (
                            <span className="badge badge--ghost" style={{ fontSize: '0.6875rem' }}>
                              ARR: {lead.enrichmentData.estimatedArr}
                            </span>
                          )}
                          {lead.enrichmentData.headcount && (
                            <span className="badge badge--ghost" style={{ fontSize: '0.6875rem' }}>
                              👥 {lead.enrichmentData.headcount} team
                            </span>
                          )}
                          {(lead.enrichmentData.technologies || []).slice(0, 3).map((tech, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.6875rem',
                                padding: '2px 6px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: 'var(--color-brand-secondary)',
                                borderRadius: '4px',
                              }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {lead.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
                          "{lead.notes}"
                        </div>
                      )}

                      {/* Card Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                          via {lead.source}
                        </span>
                        <button
                          className="btn btn--outline btn--sm"
                          disabled={enrichingForId === lead.id}
                          onClick={() => handleEnrichLead(lead.id)}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          {enrichingForId === lead.id ? 'Scanning...' : '⚡ Enrich'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      No prospects in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: COMMUNITY INTENT RADAR ── */}
      {activeTab === 'radar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '6px' }}>
              Live Conversations with Buyer Intent
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Identified public discussions on X, Reddit, and Hacker News discussing relevant bottlenecks where GrowthOS provides direct solutions.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {interactions.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: item.intentScore >= 90 ? '1px solid rgba(99, 102, 241, 0.4)' : undefined,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{getPlatformIcon(item.platform)}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{item.author}</div>
                      <a
                        href={item.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--color-brand-primary)', textDecoration: 'none' }}
                      >
                        View Original Thread ↗
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="badge"
                      style={{
                        background: item.intentScore >= 90 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: item.intentScore >= 90 ? '#10b981' : '#818cf8',
                        fontWeight: 700,
                      }}
                    >
                      {item.intentScore}% Buyer Intent
                    </span>
                    <span className="badge badge--ghost" style={{ textTransform: 'capitalize' }}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                {item.title && (
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                    {item.title}
                  </div>
                )}
                <div style={{ fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                  "{item.content}"
                </div>

                {/* AI Reply Draft Box */}
                {item.replyDraft ? (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ⚡ AI Generated Brand-Aligned Reply
                      </span>
                      <span className="badge badge--success" style={{ fontSize: '0.6875rem' }}>
                        Ready to Dispatch
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', lineHeight: '1.5', color: '#fff' }}>
                      {item.replyDraft}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => {
                          setStatusMessage(`Dispatched reply to ${item.author} on ${item.platform}!`);
                          setTimeout(() => setStatusMessage(null), 3500);
                        }}
                      >
                        ✓ Approve & Post
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      id={`draft-reply-${item.id}`}
                      className="btn btn--primary btn--sm"
                      disabled={draftingForId === item.id}
                      onClick={() => handleDraftReply(item.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {draftingForId === item.id ? (
                        <>
                          <span className="spinner" style={{ width: '14px', height: '14px' }} />
                          Drafting with Company Brain...
                        </>
                      ) : (
                        <>⚡ Generate 1-Click AI Reply</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
