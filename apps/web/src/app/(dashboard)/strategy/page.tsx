'use client';

import { useState, useEffect } from 'react';
import { getAccessToken, getStoredOrg } from '@/lib/session';
import {
  strategy,
  type GrowthGoal,
  type GrowthMission,
  type GrowthTask,
  type GrowthOpportunity,
} from '@/lib/api';

const DEFAULT_GOALS_SEED: GrowthGoal[] = [
  {
    id: 'goal-1',
    organizationId: 'org-demo',
    title: 'Scale Organic ARR to $500,000 via Autonomous SEO & Content',
    description: 'Establish dominant search authority across autonomous agent keywords and engineering-led marketing.',
    metricName: 'ARR ($)',
    targetValue: 500000,
    currentValue: 185000,
    unit: 'usd',
    deadline: '2026-12-31',
    status: 'active',
    priority: 1,
    strategyNotes: 'Focus on high-converting comparison pages, pgvector tutorials, and automated developer community distribution.',
    progressPercentage: 37,
    totalTasks: 8,
    completedTasks: 3,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'goal-2',
    organizationId: 'org-demo',
    title: 'Acquire 10,000 Verified Developer Signups',
    description: 'Grow top-of-funnel self-serve user acquisition through open-source templates and viral interactive demos.',
    metricName: 'Developer Signups',
    targetValue: 10000,
    currentValue: 3420,
    unit: 'count',
    deadline: '2026-10-15',
    status: 'active',
    priority: 2,
    strategyNotes: 'Distribute CLI tools, run benchmark studies against legacy marketing suites.',
    progressPercentage: 34,
    totalTasks: 6,
    completedTasks: 2,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_MISSIONS_SEED: GrowthMission[] = [
  {
    id: 'mission-1',
    organizationId: 'org-demo',
    goalId: 'goal-1',
    title: 'Technical SEO Authority Domination',
    objective: 'Rank in top 3 for 25 high-intent autonomous agent search terms.',
    status: 'in_progress',
    progress: 55,
    estimatedImpact: '+42% Organic Search Volume',
    ownerAgentRole: 'seo_specialist',
    deadline: '2026-10-30',
    tasks: [
      {
        id: 'task-1',
        organizationId: 'org-demo',
        missionId: 'mission-1',
        agentId: 'agent-seo',
        agentRunId: 'run-101',
        title: 'Perform SERP keyword gap audit vs top 5 competitors',
        description: 'Analyze keyword overlap, identify low-difficulty long-tail queries.',
        status: 'completed',
        priority: 'high',
        dependencies: [],
        output: 'Discovered 14 high-volume keywords with under 35 keyword difficulty.',
        isExecutable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-2',
        organizationId: 'org-demo',
        missionId: 'mission-1',
        agentId: 'agent-seo',
        agentRunId: null,
        title: 'Generate programmatic topic cluster blueprint',
        description: 'Map 6 core pillar pages and 24 satellite technical articles.',
        status: 'pending',
        priority: 'high',
        dependencies: ['task-1'],
        output: null,
        isExecutable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mission-2',
    organizationId: 'org-demo',
    goalId: 'goal-1',
    title: 'Product-Led Comparison Engine Sprint',
    objective: 'Publish 8 comprehensive migration and comparison guides with interactive benchmarks.',
    status: 'in_progress',
    progress: 30,
    estimatedImpact: '+$45k Pipeline Velocity',
    ownerAgentRole: 'content_specialist',
    deadline: '2026-11-15',
    tasks: [
      {
        id: 'task-3',
        organizationId: 'org-demo',
        missionId: 'mission-2',
        agentId: 'agent-content',
        agentRunId: null,
        title: 'Draft GrowthOS vs Legacy Marketing Automation teardown',
        description: 'Deep dive into autonomous ReAct loops vs static rule engines.',
        status: 'pending',
        priority: 'medium',
        dependencies: [],
        output: null,
        isExecutable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mission-3',
    organizationId: 'org-demo',
    goalId: 'goal-2',
    title: 'Developer Hub & Community Amplification',
    objective: 'Drive engagement across GitHub, Hacker News, and technical Reddit communities.',
    status: 'planned',
    progress: 10,
    estimatedImpact: '+1,800 Monthly Referrals',
    ownerAgentRole: 'growth_director',
    deadline: '2026-11-01',
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_OPPORTUNITIES_SEED: GrowthOpportunity[] = [
  {
    id: 'opp-1',
    organizationId: 'org-demo',
    goalId: 'goal-1',
    title: 'Interactive LLM Cost Calculator Widget',
    description: 'Embeddable calculator comparing token costs across multi-provider agent loops.',
    category: 'conversion',
    reach: 9,
    impact: 8,
    confidence: 9,
    effort: 2,
    riceScore: 324,
    iceScore: 648,
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'opp-2',
    organizationId: 'org-demo',
    goalId: 'goal-2',
    title: 'Show HN Launch: Autonomous Growth Department in Docker',
    description: 'Open source quickstart repository showing local ReAct agent execution.',
    category: 'social',
    reach: 10,
    impact: 9,
    confidence: 8,
    effort: 4,
    riceScore: 180,
    iceScore: 504,
    status: 'discovered',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'opp-3',
    organizationId: 'org-demo',
    goalId: 'goal-1',
    title: 'Automated Competitor Feature Changelog Tracker',
    description: 'Weekly automated crawl of competitor updates generating instant counter-messaging.',
    category: 'seo',
    reach: 7,
    impact: 7,
    confidence: 8,
    effort: 3,
    riceScore: 130.67,
    iceScore: 392,
    status: 'discovered',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function StrategyDashboardPage() {
  const [activeTab, setActiveTab] = useState<'goals' | 'kanban' | 'opportunities'>('goals');
  const [goals, setGoals] = useState<GrowthGoal[]>(DEFAULT_GOALS_SEED);
  const [missions, setMissions] = useState<GrowthMission[]>(DEFAULT_MISSIONS_SEED);
  const [opportunities, setOpportunities] = useState<GrowthOpportunity[]>(DEFAULT_OPPORTUNITIES_SEED);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showDecomposeModal, setShowDecomposeModal] = useState(false);
  const [showOppModal, setShowOppModal] = useState(false);
  const [selectedGoalForDecompose, setSelectedGoalForDecompose] = useState<GrowthGoal | null>(null);

  // New Goal Form
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    metricName: 'ARR ($)',
    targetValue: 100000,
    currentValue: 10000,
    unit: 'usd',
    priority: 1,
    deadline: '',
  });

  // Decompose Prompt Form
  const [decomposePrompt, setDecomposePrompt] = useState('');
  const [decomposing, setDecomposing] = useState(false);

  // New Opportunity Form
  const [newOpp, setNewOpp] = useState({
    title: '',
    description: '',
    category: 'content' as const,
    reach: 7,
    impact: 8,
    confidence: 8,
    effort: 3,
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
        const [gList, mList, oList] = await Promise.all([
          strategy.listGoals(token, org.id).catch(() => DEFAULT_GOALS_SEED),
          strategy.listMissions(token, org.id).catch(() => DEFAULT_MISSIONS_SEED),
          strategy.listOpportunities(token, org.id).catch(() => DEFAULT_OPPORTUNITIES_SEED),
        ]);

        if (gList.length > 0) setGoals(gList);
        if (mList.length > 0) setMissions(mList);
        if (oList.length > 0) setOpportunities(oList);
      } catch (err) {
        console.error('Failed to load strategy data:', err);
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

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    const org = getStoredOrg();

    const optimisticGoal: GrowthGoal = {
      id: `goal-${Date.now()}`,
      organizationId: org?.id ?? 'org-demo',
      title: newGoal.title,
      description: newGoal.description,
      metricName: newGoal.metricName,
      targetValue: Number(newGoal.targetValue),
      currentValue: Number(newGoal.currentValue),
      unit: newGoal.unit,
      deadline: newGoal.deadline || null,
      status: 'active',
      priority: Number(newGoal.priority),
      strategyNotes: null,
      progressPercentage: Math.round((Number(newGoal.currentValue) / Number(newGoal.targetValue)) * 100),
      totalTasks: 0,
      completedTasks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setGoals([optimisticGoal, ...goals]);
    setShowGoalModal(false);
    notify(`Created goal "${optimisticGoal.title}"`);

    if (token && org) {
      try {
        const created = await strategy.createGoal(token, org.id, newGoal);
        setGoals((prev) => prev.map((g) => (g.id === optimisticGoal.id ? created : g)));
      } catch (err) {
        console.error('Server save error:', err);
      }
    }
  }

  async function handleDecompose(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGoalForDecompose) return;

    setDecomposing(true);
    const token = getAccessToken();
    const org = getStoredOrg();

    try {
      if (token && org) {
        const updated = await strategy.decomposeGoal(token, org.id, selectedGoalForDecompose.id, {
          prompt: decomposePrompt,
        });
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        // Refresh missions
        const mList = await strategy.listMissions(token, org.id);
        setMissions(mList);
      } else {
        // Deterministic simulation
        const mockMission: GrowthMission = {
          id: `m-ai-${Date.now()}`,
          organizationId: 'org-demo',
          goalId: selectedGoalForDecompose.id,
          title: `Autonomous Surge: ${selectedGoalForDecompose.title.slice(0, 32)}...`,
          objective: 'Targeted multi-agent execution sprint.',
          status: 'planned',
          progress: 0,
          estimatedImpact: '+28% Velocity',
          ownerAgentRole: 'growth_director',
          deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
          tasks: [
            {
              id: `t-${Date.now()}-1`,
              organizationId: 'org-demo',
              missionId: `m-ai-${Date.now()}`,
              agentId: null,
              agentRunId: null,
              title: 'Perform competitor SERP and conversion teardown',
              description: 'Scan top search terms and identify positioning gaps.',
              status: 'pending',
              priority: 'high',
              dependencies: [],
              output: null,
              isExecutable: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setMissions([mockMission, ...missions]);
      }

      notify(`Decomposed goal into actionable missions & tactical agent tasks!`);
      setShowDecomposeModal(false);
      setDecomposePrompt('');
    } catch (err) {
      notify(`Decomposition failed: ${(err as Error).message}`, 'error');
    } finally {
      setDecomposing(false);
    }
  }

  async function handleExecuteTask(taskId: string, title: string) {
    const token = getAccessToken();
    const org = getStoredOrg();

    // Optimistically set to running
    setMissions((prev) =>
      prev.map((m) => ({
        ...m,
        tasks: m.tasks?.map((t) => (t.id === taskId ? { ...t, status: 'running' as const } : t)),
      })),
    );

    notify(`Dispatched task "${title}" to autonomous AI agent!`);

    if (token && org) {
      try {
        const updated = await strategy.executeTask(token, org.id, taskId);
        setMissions((prev) =>
          prev.map((m) => ({
            ...m,
            tasks: m.tasks?.map((t) => (t.id === taskId ? updated : t)),
          })),
        );
      } catch (err) {
        notify(`Failed to dispatch agent: ${(err as Error).message}`, 'error');
      }
    }
  }

  async function handleCreateOpportunity(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    const org = getStoredOrg();

    const rice = Math.round(((newOpp.reach * newOpp.impact * newOpp.confidence) / Math.max(0.1, newOpp.effort)) * 100) / 100;
    const ice = newOpp.impact * newOpp.confidence * (11 - newOpp.effort);

    const optimisticOpp: GrowthOpportunity = {
      id: `opp-${Date.now()}`,
      organizationId: org?.id ?? 'org-demo',
      goalId: null,
      title: newOpp.title,
      description: newOpp.description,
      category: newOpp.category,
      reach: newOpp.reach,
      impact: newOpp.impact,
      confidence: newOpp.confidence,
      effort: newOpp.effort,
      riceScore: rice,
      iceScore: ice,
      status: 'discovered',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOpportunities([optimisticOpp, ...opportunities]);
    setShowOppModal(false);
    notify(`Created opportunity with RICE score of ${rice}!`);

    if (token && org) {
      try {
        const created = await strategy.createOpportunity(token, org.id, newOpp);
        setOpportunities((prev) => prev.map((o) => (o.id === optimisticOpp.id ? created : o)));
      } catch (err) {
        console.error('Server opportunity error:', err);
      }
    }
  }

  async function handleConvertOpportunity(oppId: string, title: string) {
    const token = getAccessToken();
    const org = getStoredOrg();

    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, status: 'in_mission' as const } : o)),
    );

    notify(`Converted "${title}" into an active Growth Mission!`);

    if (token && org) {
      try {
        const mission = await strategy.convertOpportunity(token, org.id, oppId);
        setMissions([mission, ...missions]);
      } catch (err) {
        notify(`Conversion error: ${(err as Error).message}`, 'error');
      }
    }
  }

  // Calculate high-level KPI stats
  const totalGoals = goals.length;
  const activeMissions = missions.filter((m) => m.status === 'in_progress').length;
  const totalTasks = missions.reduce((acc, m) => acc + (m.tasks?.length ?? 0), 0);
  const topRiceScore = opportunities.length > 0 ? Math.max(...opportunities.map((o) => o.riceScore)) : 0;

  return (
    <div className="dash-container" style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Notification */}
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
            transition: 'all 0.3s ease',
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🎯</span>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
              Growth Strategy & Goal Decomposition Engine
            </h1>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
            Decompose high-level OKRs into sequenced missions, tactical agent tasks, and RICE-prioritized growth opportunities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowOppModal(true)}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#f8fafc',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚖</span> RICE Opportunity
          </button>
          <button
            onClick={() => setShowGoalModal(true)}
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
            <span>+</span> New Growth Goal
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
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>
            Growth Objectives
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#f8fafc' }}>
            {totalGoals} Active
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>
            North Star tracked
          </div>
        </div>

        <div
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>
            Active Missions
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#6366f1' }}>
            {activeMissions} In Sprint
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {missions.length} total sequenced
          </div>
        </div>

        <div
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>
            Tactical Agent Tasks
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#38bdf8' }}>
            {totalTasks} Tasks
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>
            Autonomous ReAct pipeline
          </div>
        </div>

        <div
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>
            Peak Opportunity RICE
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#f59e0b' }}>
            {topRiceScore} Score
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Impact / Effort optimized
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('goals')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'goals' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'goals' ? '#f8fafc' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.925rem',
            cursor: 'pointer',
          }}
        >
          Strategic Objectives & Goals ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('kanban')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'kanban' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'kanban' ? '#f8fafc' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.925rem',
            cursor: 'pointer',
          }}
        >
          Missions Kanban ({missions.length})
        </button>
        <button
          onClick={() => setActiveTab('opportunities')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'opportunities' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'opportunities' ? '#f8fafc' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.925rem',
            cursor: 'pointer',
          }}
        >
          RICE Opportunity Matrix ({opportunities.length})
        </button>
      </div>

      {/* ── TAB 1: GOALS & DECOMPOSITION ── */}
      {activeTab === 'goals' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {goals.map((goal) => (
            <div
              key={goal.id}
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.5rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1, marginRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#818cf8',
                        textTransform: 'uppercase',
                      }}
                    >
                      Priority P{goal.priority}
                    </span>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: goal.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                        color: goal.status === 'active' ? '#34d399' : '#cbd5e1',
                      }}
                    >
                      {goal.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', margin: '0.25rem 0' }}>
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>{goal.description}</p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedGoalForDecompose(goal);
                    setShowDecomposeModal(true);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#a5b4fc',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>⚡</span> Decompose with AI
                </button>
              </div>

              {/* Progress Metric Bar */}
              <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#94a3b8' }}>
                    Metric: <strong style={{ color: '#f8fafc' }}>{goal.metricName}</strong>
                  </span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                    {goal.unit === 'usd' ? `$${goal.currentValue.toLocaleString()}` : goal.currentValue.toLocaleString()} /{' '}
                    {goal.unit === 'usd' ? `$${goal.targetValue.toLocaleString()}` : goal.targetValue.toLocaleString()} (
                    {goal.progressPercentage}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${goal.progressPercentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Associated Missions & Tactical Tasks */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Sequenced Missions ({missions.filter((m) => m.goalId === goal.id).length})
                </h4>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {missions
                    .filter((m) => m.goalId === goal.id)
                    .map((m) => (
                      <div
                        key={m.id}
                        style={{
                          background: 'rgba(15, 23, 42, 0.4)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          padding: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>{m.title}</span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                              }}
                            >
                              Role: {m.ownerAgentRole}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 500 }}>
                            {m.estimatedImpact}
                          </span>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.825rem', margin: '0 0 0.75rem 0' }}>{m.objective}</p>

                        {/* Tasks list */}
                        {m.tasks && m.tasks.length > 0 && (
                          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {m.tasks.map((task) => (
                              <div
                                key={task.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: 'rgba(30, 41, 59, 0.6)',
                                  padding: '0.625rem 0.875rem',
                                  borderRadius: '6px',
                                  borderLeft: task.status === 'completed' ? '3px solid #10b981' : task.status === 'running' ? '3px solid #6366f1' : '3px solid #f59e0b',
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f1f5f9' }}>
                                    {task.title}
                                  </div>
                                  {task.output && (
                                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>
                                      ✓ Output: {task.output}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  {task.status === 'completed' ? (
                                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Completed</span>
                                  ) : task.status === 'running' ? (
                                    <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>Running Agent...</span>
                                  ) : (
                                    <button
                                      onClick={() => handleExecuteTask(task.id, task.title)}
                                      style={{
                                        padding: '0.35rem 0.75rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        borderRadius: '4px',
                                        border: '1px solid rgba(16, 185, 129, 0.4)',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: '#34d399',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      ⚡ Execute Task
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: MISSIONS KANBAN ── */}
      {activeTab === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          {(['planned', 'in_progress', 'review', 'completed'] as const).map((colStatus) => {
            const colMissions = missions.filter((m) => m.status === colStatus);
            const titles: Record<string, string> = {
              planned: 'Planned Backlog',
              in_progress: 'In Autonomous Sprint',
              review: 'Review & Verify',
              completed: 'Goal Achieved',
            };

            return (
              <div
                key={colStatus}
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '10px',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  minHeight: '400px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f8fafc' }}>
                    {titles[colStatus]}
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
                    {colMissions.length}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {colMissions.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        borderRadius: '8px',
                        padding: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {m.ownerAgentRole}
                      </div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 0.4rem 0' }}>
                        {m.title}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.75rem 0' }}>
                        {m.objective}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#10b981' }}>
                        <span>{m.estimatedImpact}</span>
                        <span>{m.tasks?.length ?? 0} Tasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 3: RICE OPPORTUNITY MATRIX ── */}
      {activeTab === 'opportunities' && (
        <div>
          <div style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            RICE Score = (Reach × Impact × Confidence) ÷ Effort. Ranked to prioritize highest autonomous ROI growth initiatives.
          </div>

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
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Opportunity</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Reach</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Impact</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Confidence</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Effort</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>RICE Score</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: opp.status === 'in_mission' ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{opp.title}</div>
                      {opp.description && (
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                          {opp.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#cbd5e1',
                          textTransform: 'uppercase',
                        }}
                      >
                        {opp.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>{opp.reach}/10</td>
                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>{opp.impact}/10</td>
                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>{opp.confidence}/10</td>
                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>{opp.effort}/10</td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: opp.riceScore >= 200 ? '#10b981' : opp.riceScore >= 100 ? '#6366f1' : '#f59e0b',
                        }}
                      >
                        {opp.riceScore}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {opp.status === 'in_mission' ? (
                        <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>Active Mission</span>
                      ) : (
                        <button
                          onClick={() => handleConvertOpportunity(opp.id, opp.title)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#a5b4fc',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Convert to Mission
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE GOAL ── */}
      {showGoalModal && (
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Create Strategic Growth Goal</h2>

            <form onSubmit={handleCreateGoal} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Goal Title / Objective
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reach $1,000,000 ARR via Autonomous Content"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
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
                    Metric Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ARR ($), Signups"
                    value={newGoal.metricName}
                    onChange={(e) => setNewGoal({ ...newGoal, metricName: e.target.value })}
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
                    Target Value
                  </label>
                  <input
                    type="number"
                    required
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal({ ...newGoal, targetValue: Number(e.target.value) })}
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
                  Current Progress Baseline
                </label>
                <input
                  type="number"
                  value={newGoal.currentValue}
                  onChange={(e) => setNewGoal({ ...newGoal, currentValue: Number(e.target.value) })}
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
                  onClick={() => setShowGoalModal(false)}
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
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DECOMPOSE GOAL ── */}
      {showDecomposeModal && selectedGoalForDecompose && (
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Autonomous Goal Decomposition</h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Goal: <strong style={{ color: '#f8fafc' }}>{selectedGoalForDecompose.title}</strong>
            </p>

            <form onSubmit={handleDecompose} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Custom Guidance for Executive Agent (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Focus specifically on technical developer adoption, product comparison benchmarks, and programmatic SEO clusters."
                  value={decomposePrompt}
                  onChange={(e) => setDecomposePrompt(e.target.value)}
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
                  onClick={() => setShowDecomposeModal(false)}
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
                  disabled={decomposing}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: decomposing ? 'not-allowed' : 'pointer',
                    opacity: decomposing ? 0.7 : 1,
                  }}
                >
                  {decomposing ? 'Decomposing Strategy...' : '⚡ Generate Strategic Missions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE OPPORTUNITY ── */}
      {showOppModal && (
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              Evaluate Growth Opportunity (RICE / ICE)
            </h2>

            <form onSubmit={handleCreateOpportunity} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Opportunity Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Interactive Benchmark Tool"
                  value={newOpp.title}
                  onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
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

              {/* Sliders for RICE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Reach: <strong>{newOpp.reach}/10</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newOpp.reach}
                    onChange={(e) => setNewOpp({ ...newOpp, reach: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Impact: <strong>{newOpp.impact}/10</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newOpp.impact}
                    onChange={(e) => setNewOpp({ ...newOpp, impact: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Confidence: <strong>{newOpp.confidence}/10</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newOpp.confidence}
                    onChange={(e) => setNewOpp({ ...newOpp, confidence: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Effort: <strong>{newOpp.effort}/10</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newOpp.effort}
                    onChange={(e) => setNewOpp({ ...newOpp, effort: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Live Preview Score */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-around',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Calculated RICE
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                    {Math.round(((newOpp.reach * newOpp.impact * newOpp.confidence) / Math.max(0.1, newOpp.effort)) * 100) / 100}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Calculated ICE
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
                    {newOpp.impact * newOpp.confidence * (11 - newOpp.effort)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowOppModal(false)}
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
                  Add Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
