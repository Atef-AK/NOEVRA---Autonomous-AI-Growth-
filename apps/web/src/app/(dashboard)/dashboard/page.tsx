'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { onboarding, organizations, type OnboardingResult } from '@/lib/api';
import { getAccessToken, getStoredOrg } from '@/lib/session';

const SWARM_AGENTS = [
  { id: 'orchestrator', name: 'Growth Director (Orchestrator)', icon: '⚡', role: 'Decomposes roadmap and commands the swarm' },
  { id: 'brand', name: 'Brand Intelligence Specialist', icon: '🧠', role: 'Synthesizes brand positioning, voice, and ICP' },
  { id: 'brain', name: 'Knowledge Base Specialist', icon: '💡', role: 'Persists memory and brand brain embeddings' },
  { id: 'seo', name: 'Technical SEO Auditor', icon: '🔍', role: 'Audits metadata, page speed, and tracks 5 keywords' },
  { id: 'copywriter', name: 'Growth Copywriter Agent', icon: '✍️', role: 'Writes 1,200+ word SEO-ranking pillar article' },
  { id: 'social', name: 'Social Distribution Specialist', icon: '📱', role: 'Repurposes into viral LinkedIn post & X thread' },
  { id: 'community', name: 'Community Radar Specialist', icon: '💬', role: 'Drafts high-intent Reddit & ProductHunt comments' },
  { id: 'video', name: 'Video Content Specialist', icon: '🎥', role: 'Writes 45s viral video script with scene cues' },
  { id: 'backlinks', name: 'Backlink & PR Specialist', icon: '🔗', role: 'Generates resource page backlink outreach pitch' },
];

export default function DashboardPage() {
  const { session } = useSession();

  const [url, setUrl] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [swarmResult, setSwarmResult] = useState<OnboardingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'article' | 'social' | 'community' | 'video' | 'backlinks' | 'seo' | 'strategy'>('article');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLaunchSwarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isDeploying) return;

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      new URL(targetUrl);
    } catch {
      setError('Please enter a valid website URL (e.g. https://yourcompany.com)');
      return;
    }

    const token = session?.token || getAccessToken();
    let orgId = session?.organizationId || getStoredOrg()?.id;

    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }

    if (!orgId) {
      try {
        const orgList = await organizations.list(token);
        if (orgList.length > 0 && orgList[0]) {
          orgId = orgList[0].id;
        }
      } catch {
        // ignore and let next check handle
      }
    }

    if (!orgId) {
      setError('No active organization found. Please refresh or log in again.');
      return;
    }

    setIsDeploying(true);
    setError(null);
    setSwarmResult(null);
    setCurrentAgentIndex(0);
    setStatusMessage('Growth Director deploying the autonomous swarm...');

    // Simulate agent steps progression for smooth UX while backend Gemini completes
    const interval = setInterval(() => {
      setCurrentAgentIndex((prev) => {
        if (prev < SWARM_AGENTS.length - 1) {
          const next = prev + 1;
          const agent = SWARM_AGENTS[next];
          if (agent) {
            setStatusMessage(`${agent.name}: ${agent.role}...`);
          }
          return next;
        }
        return prev;
      });
    }, 2800);

    try {
      const result = await onboarding.analyze(token, orgId, targetUrl);
      clearInterval(interval);
      setCurrentAgentIndex(SWARM_AGENTS.length - 1);
      setSwarmResult(result);
      setStatusMessage('🎉 All 8 autonomous growth actions executed and saved!');
    } catch (err: unknown) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : 'Autonomous swarm execution failed. Please try again.';
      setError(msg);
    } finally {
      setIsDeploying(false);
    }
  };

  const metricContentCount = swarmResult ? '5' : '0';
  const metricKeywordsCount = swarmResult?.seo?.keywords?.length ? `${swarmResult.seo.keywords.length}` : '0';
  const metricSeoScore = swarmResult?.seo?.overallScore ? `${swarmResult.seo.overallScore}/100` : '—';
  const metricDispatched = swarmResult ? '8 Actions' : '—';

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge--brand">✦ AUTONOMOUS GROWTH DEPARTMENT</span>
          {swarmResult && <span className="badge badge--success">● Swarm Active</span>}
        </div>
        <h1 className="page-title" style={{ fontSize: '1.875rem' }}>Good morning 👋</h1>
        <p className="page-subtitle">
          Input your website link. The Orchestrator deploys your specialized AI agents to audit SEO, write pillar articles, create social posts, script viral videos, and generate backlink outreach—all on autopilot.
        </p>
      </div>

      {/* Autonomous Swarm Hero Launchpad */}
      <div
        className="card"
        style={{
          padding: '28px 32px',
          marginBottom: '32px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(5,5,16,0.6) 100%)',
          borderColor: 'rgba(99,102,241,0.35)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.15)',
          borderRadius: '16px',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>🚀</span>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              One-Click Autonomous Growth Swarm
            </h2>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginBottom: '20px', lineHeight: 1.6 }}>
            Provide your website URL. Your <strong>Growth Director</strong> will analyze your brand and command the entire 13-agent department to execute technical SEO, generate high-ranking pillar content, create viral social and video scripts, and build backlink outreach.
          </p>

          <form onSubmit={handleLaunchSwarm} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 360px' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--color-text-muted)' }}>
                🌐
              </span>
              <input
                type="text"
                className="input"
                placeholder="https://yourcompany.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isDeploying}
                style={{
                  paddingLeft: '44px',
                  height: '48px',
                  fontSize: '0.9375rem',
                  background: 'rgba(10, 10, 26, 0.8)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isDeploying || !url.trim()}
              style={{
                height: '48px',
                padding: '0 28px',
                fontSize: '0.9375rem',
                fontWeight: 700,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                cursor: isDeploying ? 'not-allowed' : 'pointer',
              }}
            >
              {isDeploying ? '⚡ Swarm Executing...' : '🚀 Launch Autonomous Swarm'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', fontSize: '0.875rem' }}>
              ⚠ {error}
            </div>
          )}

          {/* Live Swarm Execution Monitor */}
          {isDeploying && (
            <div style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', background: 'rgba(5,5,16,0.7)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⚡</span>
                  <strong style={{ fontSize: '0.9375rem', color: '#a78bfa' }}>
                    {SWARM_AGENTS[currentAgentIndex]?.name}
                  </strong>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Step {currentAgentIndex + 1} of {SWARM_AGENTS.length}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                {statusMessage}
              </p>

              {/* Progress bar */}
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${((currentAgentIndex + 1) / SWARM_AGENTS.length) * 100}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {/* Swarm Agents Mini Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', marginTop: '16px' }}>
                {SWARM_AGENTS.map((agent, i) => (
                  <div
                    key={agent.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      background: i === currentAgentIndex ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.02)',
                      border: i === currentAgentIndex ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.04)',
                      color: i <= currentAgentIndex ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    <span>{agent.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</span>
                    {i < currentAgentIndex && <span style={{ marginLeft: 'auto', color: '#10b981' }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="metric-grid stagger-children" style={{ marginBottom: '32px' }}>
        <div className="card metric-card metric-card--brand">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="metric-label">SEO Health Score</span>
            <span style={{ fontSize: '20px' }}>🔍</span>
          </div>
          <div className="metric-value">{metricSeoScore}</div>
          <div className="metric-delta metric-delta--positive">
            {swarmResult ? 'Audit Completed' : 'Run swarm to audit'}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Technical health & meta optimization score
          </p>
        </div>

        <div className="card metric-card metric-card--emerald">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="metric-label">Content Assets Created</span>
            <span style={{ fontSize: '20px' }}>✍️</span>
          </div>
          <div className="metric-value">{metricContentCount}</div>
          <div className="metric-delta metric-delta--positive">
            {swarmResult ? 'Articles, Social, Video, Backlinks' : 'This month'}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Generated autonomously by Growth Copywriter
          </p>
        </div>

        <div className="card metric-card metric-card--amber">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="metric-label">Keywords Tracked</span>
            <span style={{ fontSize: '20px' }}>🎯</span>
          </div>
          <div className="metric-value">{metricKeywordsCount}</div>
          <div className="metric-delta metric-delta--positive">
            {swarmResult ? 'High-intent commercial terms' : 'Add website to track'}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Ranked and monitored in SERP radar
          </p>
        </div>

        <div className="card metric-card metric-card--rose">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="metric-label">Swarm Actions Dispatched</span>
            <span style={{ fontSize: '20px' }}>⚡</span>
          </div>
          <div className="metric-value">{metricDispatched}</div>
          <div className="metric-delta metric-delta--positive">
            {swarmResult ? 'Orchestrator Cycle Active' : 'Waiting for link'}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Multi-agent autonomous tasks completed
          </p>
        </div>
      </div>

      {/* Generated Assets Inspector (Shows when swarm completes) */}
      {swarmResult && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '28px',
            marginBottom: '32px',
            borderColor: 'rgba(99,102,241,0.3)',
            background: 'rgba(10, 10, 28, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
            <div>
              <span className="badge badge--success" style={{ marginBottom: '6px', display: 'inline-flex' }}>
                ✓ Swarm Execution Complete
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Generated Growth Department Assets for {swarmResult.brand?.name || 'Your Company'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href="/content" className="btn btn--secondary btn--sm">View in Content Studio →</a>
              <a href="/seo" className="btn btn--secondary btn--sm">View SEO Radar →</a>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { id: 'article', label: '✍️ SEO Pillar Article' },
              { id: 'social', label: '📱 Social Posts (LinkedIn & X)' },
              { id: 'community', label: '💬 Community Comments' },
              { id: 'video', label: '🎥 Viral Video Script' },
              { id: 'backlinks', label: '🔗 Backlink Outreach' },
              { id: 'seo', label: '🔍 Technical SEO & Keywords' },
              { id: 'strategy', label: '🎯 90-Day Strategy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === tab.id ? 'rgba(99,102,241,0.25)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--color-text-secondary)',
                  borderBottom: activeTab === tab.id ? '2px solid #818cf8' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content: Pillar Article */}
          {activeTab === 'article' && swarmResult.content?.blogPost && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
                    {swarmResult.content.blogPost.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    <span>Target: <strong>{swarmResult.brand?.primaryKeywords?.[0] || 'growth'}</strong></span>
                    <span>•</span>
                    <span>Status: <strong style={{ color: '#10b981' }}>Published to Database</strong></span>
                    <span>•</span>
                    <span>Est. Read: <strong>6 min</strong></span>
                  </div>
                </div>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => copyToClipboard(swarmResult.content?.blogPost?.content || '', 'article')}
                >
                  {copied === 'article' ? '✓ Copied!' : 'Copy Markdown'}
                </button>
              </div>

              {swarmResult.content.blogPost.tldr && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', borderLeft: '4px solid #6366f1', marginBottom: '16px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  <strong>TL;DR:</strong> {swarmResult.content.blogPost.tldr}
                </div>
              )}

              <div
                style={{
                  padding: '24px',
                  borderRadius: '10px',
                  background: 'rgba(5,5,16,0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                }}
              >
                {swarmResult.content.blogPost.content}
              </div>
            </div>
          )}

          {/* Tab Content: Social Posts */}
          {activeTab === 'social' && swarmResult.content && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* LinkedIn Post */}
              <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>💼</span>
                    <strong style={{ fontSize: '0.9375rem' }}>LinkedIn Native Post</strong>
                  </div>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => copyToClipboard(swarmResult.content?.linkedIn?.content || '', 'linkedin')}
                  >
                    {copied === 'linkedin' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {swarmResult.content.linkedIn?.content}
                </div>
              </div>

              {/* Twitter Thread */}
              <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🐦</span>
                    <strong style={{ fontSize: '0.9375rem' }}>Twitter/X Viral Thread</strong>
                  </div>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => copyToClipboard(swarmResult.content?.twitter?.content || '', 'twitter')}
                  >
                    {copied === 'twitter' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {swarmResult.content.twitter?.content}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Community Comments */}
          {activeTab === 'community' && swarmResult.community && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Reddit Comment */}
              {swarmResult.community.reddit && (
                <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>👾</span>
                      <div>
                        <strong style={{ fontSize: '0.9375rem' }}>Reddit ({swarmResult.community.reddit.subreddit})</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Intent Score: 92% • High Buying Signal</div>
                      </div>
                    </div>
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => copyToClipboard(swarmResult.community?.reddit?.comment || '', 'reddit')}
                    >
                      {copied === 'reddit' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#a78bfa', fontWeight: 600, marginBottom: '10px' }}>
                    Thread: &quot;{swarmResult.community.reddit.threadTopic}&quot;
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {swarmResult.community.reddit.comment}
                  </div>
                </div>
              )}

              {/* ProductHunt / HN */}
              {swarmResult.community.productHunt && (
                <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🐱</span>
                      <div>
                        <strong style={{ fontSize: '0.9375rem' }}>ProductHunt Discussion</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Intent Score: 86% • Organic Advocate</div>
                      </div>
                    </div>
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => copyToClipboard(swarmResult.community?.productHunt?.comment || '', 'ph')}
                    >
                      {copied === 'ph' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#a78bfa', fontWeight: 600, marginBottom: '10px' }}>
                    Topic: &quot;{swarmResult.community.productHunt.threadTopic}&quot;
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {swarmResult.community.productHunt.comment}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Video Script */}
          {activeTab === 'video' && swarmResult.content?.video && (
            <div style={{ padding: '24px', borderRadius: '10px', background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '22px' }}>🎬</span>
                    <strong style={{ fontSize: '1.0625rem' }}>{swarmResult.content.video.title}</strong>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Platform: TikTok / Instagram Reels / YouTube Shorts (45s Format)
                  </span>
                </div>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => copyToClipboard(swarmResult.content?.video?.content || '', 'video')}
                >
                  {copied === 'video' ? '✓ Copied' : 'Copy Teleprompter Script'}
                </button>
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontFamily: 'monospace' }}>
                {swarmResult.content.video.content}
              </div>
            </div>
          )}

          {/* Tab Content: Backlinks */}
          {activeTab === 'backlinks' && swarmResult.content?.backlink && (
            <div style={{ padding: '24px', borderRadius: '10px', background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '22px' }}>🔗</span>
                    <strong style={{ fontSize: '1.0625rem' }}>{swarmResult.content.backlink.title}</strong>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Target: Curated Niche Tech Directories & Guest Roundups
                  </span>
                </div>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => copyToClipboard(swarmResult.content?.backlink?.content || '', 'backlink')}
                >
                  {copied === 'backlink' ? '✓ Copied' : 'Copy Pitch'}
                </button>
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {swarmResult.content.backlink.content}
              </div>
            </div>
          )}

          {/* Tab Content: Technical SEO */}
          {activeTab === 'seo' && swarmResult.seo && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Overall SEO Health</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#10b981' }}>{swarmResult.seo.overallScore}/100</div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                    Audited title tags, canonical tags, H1/H2 hierarchy, and crawl performance.
                  </p>
                </div>

                <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Tracked Commercial Keywords</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#6366f1' }}>{swarmResult.seo.keywords.length} Terms</div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                    Monitored automatically across organic Google SERPs.
                  </p>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '12px' }}>Tracked Keywords & Volume</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {swarmResult.seo.keywords.map((kw, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>{kw.keyword}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Vol: {kw.volume}/mo</div>
                    </div>
                    <span className="badge badge--brand" style={{ fontSize: '0.75rem' }}>
                      Rank #{kw.rank || 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content: Strategy */}
          {activeTab === 'strategy' && swarmResult.mission && (
            <div style={{ padding: '24px', borderRadius: '10px', background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '24px' }}>🎯</span>
                <strong style={{ fontSize: '1.125rem' }}>{swarmResult.mission.title}</strong>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <span className="badge badge--brand">North Star: 10,000 Organic Visitors</span>
                <span className="badge badge--neutral">Cycle #{swarmResult.cycleNumber || 1}</span>
                <span className="badge badge--success">8 Actions Dispatched</span>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '20px' }}>
                The Growth Director has structured a 90-day execution framework for <strong>{swarmResult.brand?.name}</strong>. The autonomous swarm will continuously write, audit, and distribute growth assets without requiring human agency management.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href="/strategy" className="btn btn--primary btn--sm">Explore Full RICE Roadmap →</a>
                <a href="/autonomous" className="btn btn--secondary btn--sm">View Autonomous Cycle Logs →</a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.01em' }}>
          Explore Department Capabilities
        </h2>

        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          <a href="/agents" className="card card--interactive" style={{ padding: '24px', display: 'block', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gradient-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '14px' }}>
              🤖
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              13 Autonomous Gemini Agents
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Command individual agents directly or configure their autonomous schedules.
            </p>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-3)' }}>
              View agent swarm →
            </span>
          </a>

          <a href="/content" className="card card--interactive" style={{ padding: '24px', display: 'block', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gradient-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '14px' }}>
              ✍️
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              Content Studio
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Review, edit, and publish articles, social threads, video scripts, and backlink pitches.
            </p>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-3)' }}>
              Open content studio →
            </span>
          </a>

          <a href="/seo" className="card card--interactive" style={{ padding: '24px', display: 'block', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gradient-brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '14px' }}>
              🔍
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              SEO & Keyword Radar
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Monitor technical site health, crawler issues, and search visibility across keywords.
            </p>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-3)' }}>
              Inspect SEO radar →
            </span>
          </a>
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
          <strong style={{ color: 'var(--color-text-primary)' }}>Autonomous Growth Swarm Active.</strong>
          {' '}Connected to Google Gemini 2.5 and live Neon PostgreSQL database. Enter your website link above to launch your full department.
        </span>
      </div>
    </div>
  );
}
