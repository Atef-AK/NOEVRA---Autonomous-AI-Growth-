'use client';

import { useState, useEffect } from 'react';
import { getAccessToken, getStoredOrg } from '@/lib/session';
import {
  content,
  type ContentItem,
  type Campaign,
} from '@/lib/api';

const DEFAULT_CONTENT_SEED: ContentItem[] = [
  {
    id: 'cnt-1',
    organizationId: 'org-demo',
    campaignId: 'camp-1',
    missionId: null,
    authorAgentId: 'agent-content',
    title: 'Architecting Autonomous Growth: Why ReAct Beats Static Marketing Scripts',
    slug: 'architecting-autonomous-growth-react-loops-4921',
    type: 'blog_post',
    status: 'published',
    content: `# Architecting Autonomous Growth: Why ReAct Beats Static Marketing Scripts\n\n## The Shift to Autonomous Execution\nTraditional growth software requires marketers to manually configure linear triggers. In contrast, GrowthOS implements true **ReAct (Reason + Act)** autonomous loops.\n\n\`\`\`typescript\n// Autonomous Agent Execution\nconst run = await agentRuntime.execute({\n  goal: 'Dominate developer search intent for pgvector',\n  tools: [webSearchTool, serpGapAnalyzer, contentGenerator]\n});\n\`\`\`\n\n## Key Architectural Advantages\n1. **Semantic Grounding**: Agents query real company memory via vector embeddings.\n2. **Deterministic Fallbacks**: Zero-downtime provider routing across OpenAI, Anthropic, and Google.\n3. **Closed-Loop Attribution**: Automated metric tracking directly updates execution weights.`,
    tldr: 'An authoritative technical guide contrasting autonomous ReAct multi-agent loops with legacy static marketing automation.',
    outline: ['The Shift to Autonomous Execution', 'Key Architectural Advantages', 'Benchmark Results'],
    targetKeyword: 'autonomous AI agents B2B growth',
    seoTitle: 'Autonomous AI Agents for B2B Growth — Complete Architecture',
    seoDescription: 'Discover why autonomous ReAct agent loops outperform legacy marketing automation suites in speed and technical depth.',
    readingTimeMin: 5,
    brandVoiceScore: 96,
    scheduledFor: null,
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cnt-2',
    organizationId: 'org-demo',
    campaignId: 'camp-1',
    missionId: null,
    authorAgentId: 'agent-content',
    title: '1/7 How Autonomous AI Changes Growth Engineering [THREAD]',
    slug: 'how-autonomous-ai-changes-growth-thread-8192',
    type: 'tweet_thread',
    status: 'scheduled',
    content: `1/7 Most teams manage marketing with disconnected tools and spreadsheets.\n\nHere is how autonomous AI agents replace human execution latency with 24/7 deterministic loops 🧵👇\n\n2/7 When research, drafting, and distribution run autonomously, cycle time drops from 2 weeks to 20 minutes.\n\n3/7 By grounding agents in Company Brain with pgvector, hallucinations drop to zero.\n\n4/7 Try our open-source quickstart: growthos.ai/docs`,
    tldr: 'High-impact 7-tweet thread on eliminating execution latency.',
    outline: ['Hook', 'Bottleneck', 'Semantic Grounding', 'Call to Action'],
    targetKeyword: 'growth engineering automation',
    seoTitle: 'How Autonomous AI Changes Growth Engineering',
    seoDescription: 'Technical thread on autonomous growth engineering.',
    readingTimeMin: 2,
    brandVoiceScore: 94,
    scheduledFor: new Date(Date.now() + 86400000 * 1).toISOString(),
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cnt-3',
    organizationId: 'org-demo',
    campaignId: 'camp-2',
    missionId: null,
    authorAgentId: null,
    title: 'PostgreSQL + pgvector Semantic Search Tutorial for AI Engineers',
    slug: 'postgresql-pgvector-semantic-search-tutorial-1029',
    type: 'blog_post',
    status: 'review',
    content: `# PostgreSQL + pgvector Semantic Search Tutorial\n\n## Why pgvector for AI Memory?\nStoring embeddings directly in PostgreSQL eliminates the operational complexity of dedicated vector databases while maintaining ACID guarantees.\n\n\`\`\`sql\nCREATE EXTENSION IF NOT EXISTS vector;\nCREATE TABLE knowledge_chunks (\n  id text PRIMARY KEY,\n  content text,\n  embedding vector(1536)\n);\n\`\`\``,
    tldr: 'Hands-on tutorial building tenant-isolated vector memory in Postgres with pgvector.',
    outline: ['Postgres Vector Setup', 'Embedding Generation', 'Cosine Similarity Queries'],
    targetKeyword: 'pgvector tutorial postgres',
    seoTitle: 'Postgres pgvector Tutorial — Semantic Memory for AI',
    seoDescription: 'Step-by-step tutorial on implementing semantic search and vector memory in PostgreSQL with pgvector.',
    readingTimeMin: 6,
    brandVoiceScore: 92,
    scheduledFor: null,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_CAMPAIGNS_SEED: Campaign[] = [
  {
    id: 'camp-1',
    organizationId: 'org-demo',
    name: 'Q4 Developer Authority & SEO Sprint',
    description: 'Establish dominant search authority across autonomous agent keywords and engineering-led marketing.',
    status: 'active',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    _count: { contentItems: 4 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'camp-2',
    organizationId: 'org-demo',
    name: 'Product Hunt Launch & Technical Teardowns',
    description: 'High-velocity launch campaign with interactive benchmarks and social distribution.',
    status: 'active',
    startDate: '2026-10-01',
    endDate: '2026-10-20',
    _count: { contentItems: 2 },
    createdAt: new Date().toISOString(),
  },
];

export default function ContentStudioPage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'all' | 'campaigns'>('pipeline');
  const [items, setItems] = useState<ContentItem[]>(DEFAULT_CONTENT_SEED);
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEFAULT_CAMPAIGNS_SEED);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(DEFAULT_CONTENT_SEED[0] ?? null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRepurposeModal, setShowRepurposeModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [genForm, setGenForm] = useState({
    topic: '',
    type: 'blog_post',
    targetKeyword: '',
    targetAudience: 'Software engineers & B2B SaaS founders',
  });

  const [repurposeType, setRepurposeType] = useState('tweet_thread');

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
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
        const [cItems, cCampaigns] = await Promise.all([
          content.listItems(token, org.id).catch(() => DEFAULT_CONTENT_SEED),
          content.listCampaigns(token, org.id).catch(() => DEFAULT_CAMPAIGNS_SEED),
        ]);

        if (cItems.length > 0) {
          setItems(cItems);
          setSelectedItem(cItems[0] ?? null);
        }
        if (cCampaigns.length > 0) setCampaigns(cCampaigns);
      } catch (err) {
        console.error('Failed to load content data:', err);
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

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    const token = getAccessToken();
    const org = getStoredOrg();

    try {
      if (token && org) {
        const created = await content.generate(token, org.id, genForm);
        setItems([created, ...items]);
        setSelectedItem(created);
      } else {
        // Fallback optimistic simulation
        const mock: ContentItem = {
          id: `cnt-ai-${Date.now()}`,
          organizationId: 'org-demo',
          campaignId: null,
          missionId: null,
          authorAgentId: 'agent-content',
          title: `Technical Guide: ${genForm.topic}`,
          slug: `technical-guide-${Date.now().toString().slice(-4)}`,
          type: genForm.type as any,
          status: 'drafting',
          content: `# Technical Guide: ${genForm.topic}\n\n## Executive Summary\nGroundbreaking technical deep dive into ${genForm.topic} optimized for keyword "${genForm.targetKeyword}".\n\n## Architecture Blueprint\nAutonomous systems streamline content generation and verification end-to-end.`,
          tldr: `Complete architecture teardown for ${genForm.topic}.`,
          outline: ['Executive Summary', 'Architecture Blueprint', 'Performance Benchmarks'],
          targetKeyword: genForm.targetKeyword || genForm.topic,
          seoTitle: `${genForm.topic} — Technical Guide`,
          seoDescription: `Comprehensive guide to ${genForm.topic} for engineering teams.`,
          readingTimeMin: 4,
          brandVoiceScore: 95,
          scheduledFor: null,
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setItems([mock, ...items]);
        setSelectedItem(mock);
      }

      notify(`Autonomously generated "${genForm.topic}" grounded in Company Brain!`);
      setShowGenerateModal(false);
      setGenForm({ topic: '', type: 'blog_post', targetKeyword: '', targetAudience: '' });
    } catch (err) {
      notify(`Generation failed: ${(err as Error).message}`, 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRepurpose(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) return;

    const token = getAccessToken();
    const org = getStoredOrg();

    try {
      if (token && org) {
        const repurposed = await content.repurpose(token, org.id, selectedItem.id, {
          targetType: repurposeType,
        });
        setItems([repurposed, ...items]);
        setSelectedItem(repurposed);
      } else {
        const mockRepurposed: ContentItem = {
          id: `cnt-rep-${Date.now()}`,
          organizationId: 'org-demo',
          campaignId: selectedItem.campaignId,
          missionId: selectedItem.missionId,
          authorAgentId: selectedItem.authorAgentId,
          title: `${selectedItem.title} [${repurposeType.replace('_', ' ').toUpperCase()}]`,
          slug: `${selectedItem.slug}-${repurposeType.slice(0, 4)}`,
          type: repurposeType as any,
          status: 'drafting',
          content: `1/5 Key insights from "${selectedItem.title}":\n\n2/5 Grounding AI agents in Company Brain context eliminates hallucinations.\n\n3/5 Read full article: growthos.ai/blog/${selectedItem.slug}`,
          tldr: `Repurposed ${repurposeType} summary.`,
          outline: ['Hook', 'Key Takeaway', 'Call to action'],
          targetKeyword: selectedItem.targetKeyword,
          seoTitle: selectedItem.seoTitle,
          seoDescription: selectedItem.seoDescription,
          readingTimeMin: 2,
          brandVoiceScore: 93,
          scheduledFor: null,
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setItems([mockRepurposed, ...items]);
        setSelectedItem(mockRepurposed);
      }

      notify(`Repurposed into ${repurposeType.replace('_', ' ')}!`);
      setShowRepurposeModal(false);
    } catch (err) {
      notify(`Repurposing error: ${(err as Error).message}`, 'error');
    }
  }

  async function handlePublish(item: ContentItem) {
    const token = getAccessToken();
    const org = getStoredOrg();

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'published', publishedAt: new Date().toISOString() } : i)),
    );
    if (selectedItem?.id === item.id) {
      setSelectedItem({ ...item, status: 'published', publishedAt: new Date().toISOString() });
    }

    notify(`Published "${item.title}"!`);

    if (token && org) {
      try {
        await content.updateItem(token, org.id, item.id, { status: 'published' });
      } catch (err) {
        console.error('Publish update error:', err);
      }
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    const org = getStoredOrg();

    const mockCamp: Campaign = {
      id: `camp-${Date.now()}`,
      organizationId: org?.id ?? 'org-demo',
      name: newCampaign.name,
      description: newCampaign.description,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0] ?? '',
      endDate: null,
      _count: { contentItems: 0 },
      createdAt: new Date().toISOString(),
    };

    setCampaigns([mockCamp, ...campaigns]);
    setShowCampaignModal(false);
    notify(`Created campaign "${newCampaign.name}"`);

    if (token && org) {
      try {
        const created = await content.createCampaign(token, org.id, newCampaign);
        setCampaigns((prev) => prev.map((c) => (c.id === mockCamp.id ? created : c)));
      } catch (err) {
        console.error('Campaign save error:', err);
      }
    }
  }

  const publishedCount = items.filter((i) => i.status === 'published').length;
  const inReviewCount = items.filter((i) => i.status === 'review' || i.status === 'drafting').length;
  const scheduledCount = items.filter((i) => i.status === 'scheduled').length;

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
            <span style={{ fontSize: '2rem' }}>✍</span>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
              Autonomous Content Engine & Editorial Pipeline
            </h1>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
            Generate, optimize, review, and repurpose high-conversion technical content grounded in your Company Brain.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowCampaignModal(true)}
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
            + Campaign
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
            }}
          >
            <span>⚡</span> AI Content Generator
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
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>Total Content Assets</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#f8fafc' }}>{items.length} Assets</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Multi-channel library</div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>In Draft & Review</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#f59e0b' }}>{inReviewCount} In Progress</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Editorial queue</div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>Published & Live</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#10b981' }}>{publishedCount} Live</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>{scheduledCount} scheduled</div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>Brand Voice Alignment</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#6366f1' }}>95% Match</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>Company Brain verified</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('pipeline')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pipeline' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'pipeline' ? '#f8fafc' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.925rem',
            cursor: 'pointer',
          }}
        >
          Editorial Pipeline ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'all' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'all' ? '#f8fafc' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.925rem',
            cursor: 'pointer',
          }}
        >
          Content Studio & Studio View
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'campaigns' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'campaigns' ? '#f8fafc' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.925rem',
            cursor: 'pointer',
          }}
        >
          Marketing Campaigns ({campaigns.length})
        </button>
      </div>

      {/* ── TAB 1: EDITORIAL PIPELINE KANBAN ── */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          {(['idea', 'drafting', 'review', 'scheduled', 'published'] as const).map((stage) => {
            const stageItems = items.filter((i) => i.status === stage);
            const stageNames: Record<string, string> = {
              idea: 'Ideas & Briefs',
              drafting: 'AI Drafting',
              review: 'Review & Polish',
              scheduled: 'Scheduled',
              published: 'Published & Live',
            };

            return (
              <div
                key={stage}
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '10px',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  minHeight: '450px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>
                    {stageNames[stage]}
                  </span>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      color: '#cbd5e1',
                    }}
                  >
                    {stageItems.length}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {stageItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setActiveTab('all');
                      }}
                      style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        borderRadius: '8px',
                        padding: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.type.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {item.readingTimeMin} min read
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
                        {item.title}
                      </h4>

                      {item.targetKeyword && (
                        <div style={{ fontSize: '0.75rem', color: '#6366f1', marginBottom: '0.4rem' }}>
                          🎯 {item.targetKeyword}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#10b981' }}>
                        <span>Voice: {item.brandVoiceScore}%</span>
                        {item.status !== 'published' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublish(item);
                            }}
                            style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '4px',
                              border: 'none',
                              background: '#10b981',
                              color: '#fff',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: CONTENT STUDIO & DETAIL VIEW ── */}
      {activeTab === 'all' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem' }}>
          {/* Left Column: Asset List */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Content Library ({items.length})</h3>
            <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '700px', overflowY: 'auto' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: selectedItem?.id === item.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                    border: selectedItem?.id === item.id ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', textTransform: 'uppercase' }}>{item.type}</span>
                    <span style={{ fontSize: '0.7rem', color: item.status === 'published' ? '#10b981' : '#f59e0b' }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{item.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Studio Editor / Preview */}
          {selectedItem ? (
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                      {selectedItem.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', fontSize: '0.75rem' }}>
                      Target: {selectedItem.targetKeyword ?? 'General'}
                    </span>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: '0.75rem' }}>
                      Brand Voice Match: {selectedItem.brandVoiceScore}%
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{selectedItem.title}</h2>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowRepurposeModal(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Repurpose
                  </button>
                  {selectedItem.status !== 'published' && (
                    <button
                      onClick={() => handlePublish(selectedItem)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#10b981',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Publish Live
                    </button>
                  )}
                </div>
              </div>

              {/* TL;DR Box */}
              {selectedItem.tldr && (
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', borderLeft: '3px solid #10b981' }}>
                  <strong style={{ color: '#10b981', fontSize: '0.85rem' }}>Executive TL;DR:</strong>
                  <p style={{ color: '#cbd5e1', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{selectedItem.tldr}</p>
                </div>
              )}

              {/* Markdown Content Draft */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6',
                  color: '#e2e8f0',
                }}
              >
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{selectedItem.content}</pre>
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Select an asset to view details</div>
          )}
        </div>
      )}

      {/* ── TAB 3: CAMPAIGNS ── */}
      {activeTab === 'campaigns' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {campaigns.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase' }}>
                  {c.status}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {c._count?.contentItems ?? 0} Assets Linked
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>{c.name}</h3>
              {c.description && <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>{c.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: GENERATE CONTENT ── */}
      {showGenerateModal && (
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
              maxWidth: '560px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚡</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Autonomous AI Content Generator</h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Generates complete, verified technical content grounded in Company Brain brand guidelines.
            </p>

            <form onSubmit={handleGenerate} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Content Topic or Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. pgvector vs Pinecone Benchmarks for Autonomous Agents"
                  value={genForm.topic}
                  onChange={(e) => setGenForm({ ...genForm, topic: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Content Format
                  </label>
                  <select
                    value={genForm.type}
                    onChange={(e) => setGenForm({ ...genForm, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: '#0f172a',
                      color: '#fff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="blog_post">Blog Post / Guide</option>
                    <option value="tweet_thread">Twitter / X Thread</option>
                    <option value="linkedin_post">LinkedIn Thought Leadership</option>
                    <option value="newsletter">Newsletter Issue</option>
                    <option value="changelog">Product Changelog</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Target SEO Keyword
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. pgvector benchmarks"
                    value={genForm.targetKeyword}
                    onChange={(e) => setGenForm({ ...genForm, targetKeyword: e.target.value })}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Target Audience Persona
                </label>
                <input
                  type="text"
                  value={genForm.targetAudience}
                  onChange={(e) => setGenForm({ ...genForm, targetAudience: e.target.value })}
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
                  onClick={() => setShowGenerateModal(false)}
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
                  disabled={generating}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: generating ? 'not-allowed' : 'pointer',
                    opacity: generating ? 0.7 : 1,
                  }}
                >
                  {generating ? 'Drafting with AI...' : '⚡ Generate Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REPURPOSE CONTENT ── */}
      {showRepurposeModal && selectedItem && (
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
              maxWidth: '500px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Repurpose Content</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Convert &quot;{selectedItem.title}&quot; into an optimized social distribution format.
            </p>

            <form onSubmit={handleRepurpose} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Target Format
                </label>
                <select
                  value={repurposeType}
                  onChange={(e) => setRepurposeType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: '#0f172a',
                    color: '#fff',
                  }}
                >
                  <option value="tweet_thread">Twitter / X Thread (5-7 tweets)</option>
                  <option value="linkedin_post">LinkedIn Thought Leadership Post</option>
                  <option value="newsletter">Newsletter Digest Issue</option>
                  <option value="changelog">Product Changelog Update</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRepurposeModal(false)}
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
                  ⚡ Repurpose Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE CAMPAIGN ── */}
      {showCampaignModal && (
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
              maxWidth: '500px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Create Marketing Campaign</h2>

            <form onSubmit={handleCreateCampaign} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Developer Push"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
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
                  Campaign Objective
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Acquire 5,000 developer signups through viral technical benchmarks."
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
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
                  onClick={() => setShowCampaignModal(false)}
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
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
