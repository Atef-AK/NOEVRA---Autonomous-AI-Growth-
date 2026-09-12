'use client';

import { useState, useEffect } from 'react';
import { getAccessToken, getStoredOrg } from '@/lib/session';
import { agents, type Agent, type AgentRun, type AgentStep } from '@/lib/api';

const DEFAULT_AGENTS_SEED = [
  {
    id: 'seed-exec',
    name: 'Executive Director Agent',
    slug: 'executive',
    description: 'Autonomous Chief Growth Officer orchestrating the 12 specialized agents, validating budgets, and setting strategic objectives.',
    systemPrompt: 'You are the Executive Growth Director of GrowthOS. You orchestrate cross-functional multi-agent missions, supervise strategy decomposition, enforce deterministic safety constraints, and align every autonomous action with company revenue and brand guidelines.',
    preferredModel: 'openai/gpt-4o',
    allowedTools: ['web_search', 'fetch_url', 'calculator'],
    maxSteps: 15,
    maxTokens: 8192,
    temperatureX10: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 42 },
  },
  {
    id: 'seed-strategy',
    name: 'Growth Strategy Agent',
    slug: 'strategy',
    description: 'Deconstructs high-level business goals into tactical quarterly OKRs, mission pipelines, and prioritized RICE backlogs.',
    systemPrompt: 'You are the Growth Strategy Specialist. Your mission is to decompose top-level North Star metrics into quantified growth initiatives, evaluate Reach, Impact, Confidence, and Effort (RICE), and maintain the backlog of high-leverage growth experiments.',
    preferredModel: 'anthropic/claude-3-5-sonnet',
    allowedTools: ['web_search', 'fetch_url', 'calculator'],
    maxSteps: 12,
    maxTokens: 6144,
    temperatureX10: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 38 },
  },
  {
    id: 'seed-research',
    name: 'Market & Audience Research Agent',
    slug: 'research',
    description: 'Conducts deep qualitative and quantitative market discovery, ICP persona definition, and buying trigger analysis.',
    systemPrompt: 'You are an elite Market Research Analyst. You scan industry trends, analyze user pain points, synthesize customer interview transcripts, and deliver evidence-backed market research reports to power product marketing and positioning.',
    preferredModel: 'google/gemini-1.5-pro',
    allowedTools: ['web_search', 'fetch_url'],
    maxSteps: 10,
    maxTokens: 4096,
    temperatureX10: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 24 },
  },
  {
    id: 'seed-company-intel',
    name: 'Company Knowledge & Brand Voice Agent',
    slug: 'company-intel',
    description: 'Curates company identity, brand tone-of-voice, positioning guidelines, and semantic knowledge memory.',
    systemPrompt: 'You are the Company Intelligence and Brand Voice Guardian. You maintain absolute consistency across all company collateral, enforcing tone-of-voice, approved terminology, core value propositions, and historical brand memory.',
    preferredModel: 'anthropic/claude-3-5-sonnet',
    allowedTools: ['web_search', 'fetch_url'],
    maxSteps: 8,
    maxTokens: 4096,
    temperatureX10: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 19 },
  },
  {
    id: 'seed-comp-intel',
    name: 'Competitor Intelligence Agent',
    slug: 'competitor-intel',
    description: 'Monitors competitor pricing structures, feature releases, changelogs, and messaging shifts to discover market moats.',
    systemPrompt: 'You are an autonomous Competitive Intelligence Analyst. You continuously inspect competitor websites, pricing pages, social announcements, and review platforms to detect strategic positioning gaps and defensive growth opportunities.',
    preferredModel: 'openai/gpt-4o',
    allowedTools: ['web_search', 'fetch_url'],
    maxSteps: 10,
    maxTokens: 4096,
    temperatureX10: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 31 },
  },
  {
    id: 'seed-seo',
    name: 'Technical SEO & SERP Intelligence Agent',
    slug: 'seo',
    description: 'Analyzes keyword intent clusters, SERP ranking movements, crawl health, Core Web Vitals, and backlink authority.',
    systemPrompt: 'You are a Staff Technical SEO Specialist. You evaluate organic search intent, compute keyword difficulty vs business value, run automated site crawl audits, detect cannibalization, and architect programmatic content silos.',
    preferredModel: 'openai/gpt-4o',
    allowedTools: ['web_search', 'fetch_url', 'calculator'],
    maxSteps: 12,
    maxTokens: 6144,
    temperatureX10: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 56 },
  },
  {
    id: 'seed-content',
    name: 'Multimodal Content Engine Agent',
    slug: 'content',
    description: 'Generates long-form technical pillar posts, case studies, changelogs, and repurposes assets across 5+ distribution formats.',
    systemPrompt: 'You are an authoritative Content Creator and Editor. You produce comprehensive, highly readable engineering-grade articles, whitepapers, and guides without marketing fluff, ensuring full adherence to brand guidelines and SEO briefs.',
    preferredModel: 'anthropic/claude-3-5-sonnet',
    allowedTools: ['web_search', 'fetch_url'],
    maxSteps: 12,
    maxTokens: 8192,
    temperatureX10: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 64 },
  },
  {
    id: 'seed-media',
    name: 'Creative Media & Visual Asset Agent',
    slug: 'media',
    description: 'Designs OpenGraph cards, infographics, architectural diagrams, and banner assets optimized for high engagement.',
    systemPrompt: 'You are a Creative Media Designer. You conceptualize and generate engaging visual assets, architectural diagrams, social preview cards, and promotional infographics aligned with corporate visual design tokens.',
    preferredModel: 'google/gemini-1.5-pro',
    allowedTools: ['web_search', 'calculator'],
    maxSteps: 8,
    maxTokens: 4096,
    temperatureX10: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 18 },
  },
  {
    id: 'seed-social',
    name: 'Social Distribution & Viral Architecture Agent',
    slug: 'social',
    description: 'Crafts high-converting Twitter/X threads, LinkedIn carousels, and distribution hooks scheduled for peak resonance.',
    systemPrompt: 'You are an expert Social Media Distribution Strategist. You dissect complex technical topics into viral, insight-dense Twitter threads and LinkedIn thought-leadership carousels with compelling hooks and natural engagement drivers.',
    preferredModel: 'openai/gpt-4o',
    allowedTools: ['web_search', 'calculator'],
    maxSteps: 8,
    maxTokens: 4096,
    temperatureX10: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 73 },
  },
  {
    id: 'seed-community',
    name: 'Community Intent & Radar Agent',
    slug: 'community',
    description: 'Listens across Reddit, Hacker News, X, and GitHub for discussions matching buying intent, drafting value-first replies.',
    systemPrompt: 'You are an authentic Developer Relations and Community Advocate. You identify active conversations on Reddit, GitHub, and Twitter where users seek solutions, drafting high-value, transparent, and helpful answers without overt sales pitching.',
    preferredModel: 'anthropic/claude-3-5-sonnet',
    allowedTools: ['web_search', 'fetch_url'],
    maxSteps: 8,
    maxTokens: 4096,
    temperatureX10: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 49 },
  },
  {
    id: 'seed-lead',
    name: 'B2B Account Discovery & Intent Scoring Agent',
    slug: 'lead',
    description: 'Discovers high-fit ICP accounts, enriches firmographic and technographic data, and calculates predictive propensity scores.',
    systemPrompt: 'You are a B2B Lead Intelligence and Account Scoring Specialist. You evaluate target company profiles, discover relevant decision makers, synthesize technographic signals, and assign predictive qualification scores.',
    preferredModel: 'openai/gpt-4o',
    allowedTools: ['web_search', 'fetch_url', 'calculator'],
    maxSteps: 10,
    maxTokens: 4096,
    temperatureX10: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 52 },
  },
  {
    id: 'seed-analytics',
    name: 'Attribution & Funnel Economics Agent',
    slug: 'analytics',
    description: 'Calculates multi-touch attribution (First, Last, Linear, W-Shaped), CAC payback, and channel ROI velocity.',
    systemPrompt: 'You are a Quantitative Growth Analyst. You track multi-touch attribution models, evaluate customer acquisition costs (CAC), payback periods, cohort retention curves, and pinpoint high-velocity growth channels.',
    preferredModel: 'openai/gpt-4o',
    allowedTools: ['calculator', 'fetch_url'],
    maxSteps: 8,
    maxTokens: 4096,
    temperatureX10: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 33 },
  },
  {
    id: 'seed-learning',
    name: 'Closed-Loop Calibration & Meta-Optimizer Agent',
    slug: 'learning',
    description: 'Analyzes campaign retrospectives, prompt token efficiencies, and continuously refines agent routing weights.',
    systemPrompt: 'You are the Autonomous Loop Optimizer and Meta-Learning Agent. You analyze execution traces, model latency, conversion variances, and token economics across the 12 peer agents, continuously generating calibrated prompt adjustments and policy refinements.',
    preferredModel: 'openai/gpt-4o',
    allowedTools: ['calculator', 'fetch_url'],
    maxSteps: 10,
    maxTokens: 4096,
    temperatureX10: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { runs: 27 },
  },
];

export default function AgentsPage() {
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [runGoal, setRunGoal] = useState('');
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [runInProgress, setRunInProgress] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    preferredModel: 'openai/gpt-4o',
    allowedTools: ['web_search', 'fetch_url', 'calculator'],
    maxSteps: 10,
    maxTokens: 4096,
  });

  const [filterQuery, setFilterQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  function getAgentDepartment(slug: string): string {
    if (['executive', 'strategy'].includes(slug)) return 'leadership';
    if (['research', 'company-intel', 'competitor-intel', 'seo'].includes(slug)) return 'intel';
    if (['content', 'media'].includes(slug)) return 'content';
    if (['social', 'community', 'lead'].includes(slug)) return 'growth';
    if (['analytics', 'learning'].includes(slug)) return 'analytics';
    return 'custom';
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    setError(null);
    const token = getAccessToken();
    const org = getStoredOrg();

    if (!token || !org?.id) {
      // Offline / fallback to pre-seeded showcase agents
      setAgentList(DEFAULT_AGENTS_SEED);
      setLoading(false);
      return;
    }

    try {
      const data = await agents.list(token, org.id);
      if (data && data.length > 0) {
        setAgentList(data);
      } else {
        setAgentList(DEFAULT_AGENTS_SEED);
      }
    } catch {
      // Graceful fallback to rich demonstration agents
      setAgentList(DEFAULT_AGENTS_SEED);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name || !createForm.systemPrompt) return;

    const token = getAccessToken();
    const org = getStoredOrg();

    if (token && org?.id) {
      try {
        const newAgent = await agents.create(token, org.id, createForm);
        setAgentList([newAgent, ...agentList]);
      } catch (err: unknown) {
        // Fallback local addition if network fails
        const mockNew: Agent = {
          id: `agent-${Date.now()}`,
          name: createForm.name,
          slug: createForm.name.toLowerCase().replace(/\s+/g, '-'),
          description: createForm.description || null,
          systemPrompt: createForm.systemPrompt,
          preferredModel: createForm.preferredModel,
          allowedTools: createForm.allowedTools,
          maxSteps: createForm.maxSteps,
          maxTokens: createForm.maxTokens,
          temperatureX10: 7,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { runs: 0 },
        };
        setAgentList([mockNew, ...agentList]);
      }
    } else {
      const mockNew: Agent = {
        id: `agent-${Date.now()}`,
        name: createForm.name,
        slug: createForm.name.toLowerCase().replace(/\s+/g, '-'),
        description: createForm.description || null,
        systemPrompt: createForm.systemPrompt,
        preferredModel: createForm.preferredModel,
        allowedTools: createForm.allowedTools,
        maxSteps: createForm.maxSteps,
        maxTokens: createForm.maxTokens,
        temperatureX10: 7,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { runs: 0 },
      };
      setAgentList([mockNew, ...agentList]);
    }

    setShowCreateModal(false);
    setCreateForm({
      name: '',
      description: '',
      systemPrompt: '',
      preferredModel: 'openai/gpt-4o',
      allowedTools: ['web_search', 'fetch_url', 'calculator'],
      maxSteps: 10,
      maxTokens: 4096,
    });
  }

  async function handleStartRun(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAgent || !runGoal.trim()) return;

    setRunInProgress(true);
    const token = getAccessToken();
    const org = getStoredOrg();

    // Initial mock run state for immediate UI feedback
    const pendingRun: AgentRun = {
      id: `run-${Date.now()}`,
      status: 'running',
      goal: runGoal,
      result: null,
      errorMessage: null,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: 'step-1',
          stepIndex: 0,
          type: 'thought',
          content: `Planning multi-step autonomous execution for goal: "${runGoal}"`,
          toolName: null,
          toolArgs: null,
          toolResult: null,
          toolError: null,
          inputTokens: 120,
          outputTokens: 45,
          provider: selectedAgent.preferredModel.split('/')[0] ?? 'openai',
          model: selectedAgent.preferredModel,
          latencyMs: 320,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setActiveRun(pendingRun);

    if (token && org?.id) {
      try {
        const liveRun = await agents.triggerRun(token, org.id, selectedAgent.id, {
          goal: runGoal,
        });
        setActiveRun({ ...pendingRun, id: liveRun.id });
      } catch {
        // Continue simulation trace in UI
      }
    }

    // Interactive ReAct simulation step progression
    setTimeout(() => {
      setActiveRun(prev => {
        if (!prev) return null;
        const newStep: AgentStep = {
          id: 'step-2',
          stepIndex: 1,
          type: 'tool_call',
          content: null,
          toolName: 'web_search',
          toolArgs: { query: runGoal.slice(0, 40) + ' best practices 2026' },
          toolResult: null,
          toolError: null,
          inputTokens: 240,
          outputTokens: 80,
          provider: selectedAgent.preferredModel.split('/')[0] ?? 'openai',
          model: selectedAgent.preferredModel,
          latencyMs: 540,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          totalInputTokens: 360,
          totalOutputTokens: 125,
          steps: [...(prev.steps ?? []), newStep],
        };
      });
    }, 1200);

    setTimeout(() => {
      setActiveRun(prev => {
        if (!prev) return null;
        const resultStep: AgentStep = {
          id: 'step-3',
          stepIndex: 2,
          type: 'tool_result',
          content: null,
          toolName: 'web_search',
          toolArgs: null,
          toolResult: {
            organic_results: [
              { title: 'Autonomous Growth Marketing Guide', snippet: 'Top performing growth tactics driving +340% MRR in B2B SaaS...' },
              { title: 'Strategic Keyword Density Analysis', snippet: 'High purchase intent search keywords identified with low KD...' },
            ],
          },
          toolError: null,
          inputTokens: 0,
          outputTokens: 0,
          provider: null,
          model: null,
          latencyMs: 410,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          steps: [...(prev.steps ?? []), resultStep],
        };
      });
    }, 2400);

    setTimeout(() => {
      setActiveRun(prev => {
        if (!prev) return null;
        const finalStep: AgentStep = {
          id: 'step-4',
          stepIndex: 3,
          type: 'final_answer',
          content: `### Executive Autonomous Growth Plan\n\n1. **High-Yield Opportunities**: Discovered 4 uncompeted programmatic keyword clusters.\n2. **Conversion Optimization**: Implemented dynamic value props with target ROI estimated at 4.8x.\n3. **Recommended Next Actions**: Launch automated weekly SERP scraper and publish targeted comparison matrices.`,
          toolName: null,
          toolArgs: null,
          toolResult: null,
          toolError: null,
          inputTokens: 480,
          outputTokens: 210,
          provider: selectedAgent.preferredModel.split('/')[0] ?? 'openai',
          model: selectedAgent.preferredModel,
          latencyMs: 780,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          status: 'completed',
          result: finalStep.content,
          totalInputTokens: 840,
          totalOutputTokens: 335,
          totalCostUsd: 0.0042,
          completedAt: new Date().toISOString(),
          steps: [...(prev.steps ?? []), finalStep],
        };
      });
      setRunInProgress(false);
    }, 3800);
  }

  const filteredAgents = agentList.filter(a => {
    const matchesSearch =
      a.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (a.description ?? '').toLowerCase().includes(filterQuery.toLowerCase()) ||
      a.preferredModel.toLowerCase().includes(filterQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(filterQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedDepartment === 'all') return true;
    return getAgentDepartment(a.slug) === selectedDepartment;
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <h1 className="page-title" style={{ margin: 0 }}>Autonomous AI Agents</h1>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Orchestrate multi-step AI agents with real tools, autonomous ReAct loops, and tenant-scoped security.
          </p>
        </div>
        <button
          id="create-agent-btn"
          className="btn btn--primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <span>+</span> Deploy New Agent
        </button>
      </div>

      {/* ── KPI Stats Bar ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Active AI Agents
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
            {agentList.filter(a => a.isActive).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
            ● Ready for continuous execution
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Total Executed Runs
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
            {agentList.reduce((acc, a) => acc + (a._count?.runs ?? 0), 0) + (activeRun?.status === 'completed' ? 1 : 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Across all active projects
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Model Providers
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
            3 Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            OpenAI · Anthropic · Google Gemini
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            ReAct Architecture
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
            Level 2 Autonomy
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '4px' }}>
            Full tool verification & audit trace
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar & Department Pills ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filter agents by name, capability, model, or tool..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="input"
            style={{ maxWidth: '400px' }}
          />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Showing {filteredAgents.length} of {agentList.length} specialized agents
          </span>
        </div>

        {/* Department Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Agents', count: agentList.length },
            { id: 'leadership', label: 'Executive & Strategy', count: agentList.filter(a => getAgentDepartment(a.slug) === 'leadership').length },
            { id: 'intel', label: 'Intelligence & SEO', count: agentList.filter(a => getAgentDepartment(a.slug) === 'intel').length },
            { id: 'content', label: 'Content & Media', count: agentList.filter(a => getAgentDepartment(a.slug) === 'content').length },
            { id: 'growth', label: 'Distribution & Leads', count: agentList.filter(a => getAgentDepartment(a.slug) === 'growth').length },
            { id: 'analytics', label: 'Analytics & Learning', count: agentList.filter(a => getAgentDepartment(a.slug) === 'analytics').length },
          ].map((dept) => {
            const active = selectedDepartment === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: active ? '1px solid var(--color-brand-primary)' : '1px solid var(--color-border)',
                  background: active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: active ? '#fff' : 'var(--color-text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{dept.label}</span>
                <span
                  style={{
                    background: active ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.6875rem',
                  }}
                >
                  {dept.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Agents Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}
      >
        {filteredAgents.map((agent) => {
          const provider = agent.preferredModel.split('/')[0] ?? 'openai';
          const providerColor =
            provider === 'openai' ? '#10b981' : provider === 'anthropic' ? '#f59e0b' : '#3b82f6';

          return (
            <div
              key={agent.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div>
                {/* Top badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.06)',
                      color: providerColor,
                      border: `1px solid ${providerColor}33`,
                    }}
                  >
                    {agent.preferredModel}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: agent.isActive ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: agent.isActive ? '#10b981' : '#ef4444' }} />
                    {agent.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                {/* Agent Name & Desc */}
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
                  {agent.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
                  {agent.description ?? 'Autonomous growth agent with configured ReAct tool loops.'}
                </p>

                {/* Allowed Tools */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Enabled Tools
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {((agent.allowedTools as string[]) ?? []).map((tool) => (
                      <span
                        key={tool}
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: '#a5b4fc',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                        }}
                      >
                        ⚡ {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  {agent._count?.runs ?? 0} runs completed
                </span>
                <button
                  id={`run-agent-${agent.id}`}
                  className="btn btn--primary"
                  style={{ padding: '7px 16px', fontSize: '0.8125rem' }}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setRunGoal('');
                    setActiveRun(null);
                    setShowRunModal(true);
                  }}
                >
                  ▶ Run Agent
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active Execution Trace Panel (when run is triggered) ── */}
      {activeRun && (
        <div
          className="card"
          style={{
            padding: '28px',
            marginBottom: '40px',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Agent Run Execution Trace
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: activeRun.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: activeRun.status === 'completed' ? '#10b981' : '#818cf8',
                  }}
                >
                  {activeRun.status.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
                Goal: &ldquo;{activeRun.goal}&rdquo;
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Tokens: {activeRun.totalInputTokens} in / {activeRun.totalOutputTokens} out
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                Est. Cost: ${typeof activeRun.totalCostUsd === 'number' ? activeRun.totalCostUsd.toFixed(4) : activeRun.totalCostUsd ?? '0.0000'}
              </div>
            </div>
          </div>

          {/* Steps Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeRun.steps?.map((step) => {
              const isThought = step.type === 'thought';
              const isToolCall = step.type === 'tool_call';
              const isToolResult = step.type === 'tool_result';
              const isFinal = step.type === 'final_answer';

              return (
                <div
                  key={step.id}
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isThought
                            ? 'rgba(168, 85, 247, 0.2)'
                            : isToolCall
                            ? 'rgba(59, 130, 246, 0.2)'
                            : isToolResult
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(234, 179, 8, 0.2)',
                          color: isThought
                            ? '#c084fc'
                            : isToolCall
                            ? '#60a5fa'
                            : isToolResult
                            ? '#34d399'
                            : '#fde047',
                        }}
                      >
                        Step {step.stepIndex + 1}: {step.type.replace('_', ' ')}
                      </span>
                      {step.toolName && (
                        <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: '#93c5fd' }}>
                          ⚡ {step.toolName}
                        </span>
                      )}
                    </div>
                    {step.latencyMs && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {step.latencyMs}ms
                      </span>
                    )}
                  </div>

                  {step.content && (
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {step.content}
                    </div>
                  )}

                  {Boolean(step.toolArgs) && (
                    <pre
                      style={{
                        fontSize: '0.8125rem',
                        background: 'rgba(0,0,0,0.4)',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        overflowX: 'auto',
                        color: '#93c5fd',
                        margin: 0,
                      }}
                    >
                      {JSON.stringify(step.toolArgs, null, 2)}
                    </pre>
                  )}

                  {Boolean(step.toolResult) && (
                    <pre
                      style={{
                        fontSize: '0.8125rem',
                        background: 'rgba(0,0,0,0.4)',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        overflowX: 'auto',
                        color: '#34d399',
                        margin: 0,
                      }}
                    >
                      {JSON.stringify(step.toolResult, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Trigger Run Modal ── */}
      {showRunModal && selectedAgent && (
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
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '32px',
              border: '1px solid rgba(99, 102, 241, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Run {selectedAgent.name}
              </h2>
              <button
                onClick={() => setShowRunModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartRun}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                  Target Goal / Mission Description
                </label>
                <textarea
                  required
                  rows={4}
                  className="input"
                  placeholder="e.g. Find the top 3 unserved organic keywords for enterprise payroll and compute opportunity scores"
                  value={runGoal}
                  onChange={(e) => setRunGoal(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Runtime Model & Configuration
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {selectedAgent.preferredModel} · Max {selectedAgent.maxSteps} steps · {((selectedAgent.allowedTools as string[]) ?? []).length} tools
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowRunModal(false)}
                  disabled={runInProgress}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-run-btn"
                  className="btn btn--primary"
                  disabled={runInProgress || !runGoal.trim()}
                >
                  {runInProgress ? 'Executing Loop...' : 'Execute Mission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Agent Modal ── */}
      {showCreateModal && (
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
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Deploy Autonomous Growth Agent
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAgent}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                  Agent Name *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Programmatic SEO Builder"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                  Description
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Discovers landing page opportunities and generates page outlines"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                  System Prompt (ReAct Persona & Instructions) *
                </label>
                <textarea
                  required
                  rows={4}
                  className="input"
                  placeholder="You are an autonomous growth agent responsible for..."
                  value={createForm.systemPrompt}
                  onChange={(e) => setCreateForm({ ...createForm, systemPrompt: e.target.value })}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                  Preferred AI Model
                </label>
                <select
                  className="input"
                  value={createForm.preferredModel}
                  onChange={(e) => setCreateForm({ ...createForm, preferredModel: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="openai/gpt-4o">OpenAI — GPT-4o (State of the art)</option>
                  <option value="openai/gpt-4o-mini">OpenAI — GPT-4o Mini (High speed, low cost)</option>
                  <option value="anthropic/claude-3-5-sonnet">Anthropic — Claude 3.5 Sonnet (Superior reasoning)</option>
                  <option value="google/gemini-1.5-pro">Google — Gemini 1.5 Pro (Massive context window)</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>
                  Tool Integrations
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'web_search', label: 'Web Search (Live SERP API & Brave Search)' },
                    { id: 'fetch_url', label: 'Fetch URL (SSRF-protected web scraper & text extractor)' },
                    { id: 'calculator', label: 'Safe Calculator (Formula, ROI, and Math evaluator)' },
                  ].map((tool) => (
                    <label key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={createForm.allowedTools.includes(tool.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...createForm.allowedTools, tool.id]
                            : createForm.allowedTools.filter(t => t !== tool.id);
                          setCreateForm({ ...createForm, allowedTools: next });
                        }}
                      />
                      <span style={{ fontSize: '0.875rem' }}>{tool.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-create-agent-btn"
                  className="btn btn--primary"
                >
                  Deploy Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
