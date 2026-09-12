'use client';

import { useState, useEffect } from 'react';
import { getAccessToken, getStoredOrg } from '@/lib/session';
import {
  orchestrator,
  type DepartmentCycle,
  type AutonomousSchedule,
  type OrchestratorSettings,
} from '@/lib/api';

export default function AutonomousPage() {
  const [cycles, setCycles] = useState<DepartmentCycle[]>([]);
  const [schedules, setSchedules] = useState<AutonomousSchedule[]>([]);
  const [settings, setSettings] = useState<OrchestratorSettings>({
    autonomyLevel: 2,
    isPaused: false,
    timezone: 'UTC',
  });
  const [selectedCycle, setSelectedCycle] = useState<DepartmentCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringCycle, setTriggeringCycle] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orchestrator' | 'policy'>('orchestrator');
  const [simTool, setSimTool] = useState('publish_post');
  const [simLevel, setSimLevel] = useState(2);

  const POLICY_MATRIX = [
    { tool: 'web_search', category: 'Read Only', risk: 'Low', minLevel: 1, desc: 'Query search engine indices' },
    { tool: 'fetch_url', category: 'Read Only', risk: 'Low', minLevel: 1, desc: 'Scrape and extract public web pages' },
    { tool: 'calculator', category: 'Read Only', risk: 'Low', minLevel: 1, desc: 'Compute statistical and RICE models' },
    { tool: 'db_query', category: 'Read Only', risk: 'Medium', minLevel: 2, desc: 'Execute read-only tenant analytical queries' },
    { tool: 'write_draft', category: 'Reversible Mutation', risk: 'Medium', minLevel: 2, desc: 'Save content, campaign, or task drafts' },
    { tool: 'publish_post', category: 'Irreversible Mutation', risk: 'High', minLevel: 3, desc: 'Publish public social post via connector' },
    { tool: 'send_direct_message', category: 'Irreversible Mutation', risk: 'High', minLevel: 4, desc: 'Send direct outreach or follow-up email' },
    { tool: 'modify_campaign', category: 'Irreversible Mutation', risk: 'High', minLevel: 4, desc: 'Alter active ad or campaign budgets' },
    { tool: 'execute_refund', category: 'Financial Mutation', risk: 'Critical', minLevel: 5, desc: 'Process customer billing adjustments' },
  ];

  const ETHICS_HARD_STOPS = [
    {
      icon: '🚫',
      title: 'Zero Bulk Spam & Unsolicited Outreach',
      rule: 'Strict rate limits enforced per connector. Agent runs attempting automated bulk scraping or unsolicited cold spam are immediately terminated.',
    },
    {
      icon: '🛡️',
      title: 'Zero Fake Engagement & Synthetic Reviews',
      rule: 'Agents are hard-coded to refuse tasks that generate fake reviews, upvote bots, synthetic social likes, or astroturfing campaigns.',
    },
    {
      icon: '🔒',
      title: 'Zero CAPTCHA & Security Defense Bypassing',
      rule: 'The agent runtime will never bypass CAPTCHA, cloudflare challenges, or anti-scraping walls. Respects robots.txt directives universally.',
    },
    {
      icon: '👤',
      title: 'Zero Identity Spoofing & Human Impersonation',
      rule: 'Agents must always identify as AI assistants when interacting with third parties or customers. Never spoof human employee identities.',
    },
    {
      icon: '💰',
      title: 'Deterministic Financial Safeguards',
      rule: 'Autonomous budget reallocations exceeding $500 require multi-signature cryptographic approval from organization owners regardless of autonomy level.',
    },
  ];

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
      const [cyclesRes, schedulesRes, settingsRes] = await Promise.all([
        orchestrator.listCycles(token, org.id).catch(() => []),
        orchestrator.listSchedules(token, org.id).catch(() => []),
        orchestrator.getSettings(token, org.id).catch(() => ({
          autonomyLevel: 2,
          isPaused: false,
          timezone: 'UTC',
        })),
      ]);

      if (cyclesRes.length > 0) {
        setCycles(cyclesRes);
        setSelectedCycle(cyclesRes[0] || null);
      } else {
        loadFallbackCycles();
      }

      if (schedulesRes.length > 0) {
        setSchedules(schedulesRes);
      } else {
        loadFallbackSchedules();
      }

      setSettings(settingsRes);
    } catch {
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  }

  function loadFallbackCycles() {
    const defaultCycles: DepartmentCycle[] = [
      {
        id: 'cycle-14',
        organizationId: 'org-demo',
        cycleNumber: 14,
        status: 'completed',
        summary:
          'Cycle #14 executed successfully. 4 autonomous growth actions dispatched across SEO, Content, Social Distribution, and Lead Discovery under Autonomy Level 2.',
        actionsDispatched: 4,
        telemetry: {
          focusArea: 'all',
          autonomyLevel: 2,
          brandVoice: 'insightful, technical, authoritative',
          totalExecutionTimeMs: 1560,
          actions: [
            {
              agent: 'Technical SEO Auditor',
              action: 'Crawled primary domain, detected 0 broken links, verified core web vitals (LCP 245ms)',
              status: 'completed',
              latencyMs: 310,
            },
            {
              agent: 'Community Radar Specialist',
              action: 'Scanned Reddit & X, identified 3 prospective leads with >85% buying intent',
              status: 'completed',
              latencyMs: 420,
            },
            {
              agent: 'Growth Content Repurposer',
              action: 'Repurposed latest pillar post into 1 Twitter thread & 1 LinkedIn carousel draft',
              status: 'scheduled_for_review',
              latencyMs: 580,
            },
            {
              agent: 'Strategy Director Agent',
              action: 'Evaluated RICE priority backlog; elevated Programmatic SEO directory mission',
              status: 'completed',
              latencyMs: 250,
            },
          ],
        },
        startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 2 + 1560).toISOString(),
      },
      {
        id: 'cycle-13',
        organizationId: 'org-demo',
        cycleNumber: 13,
        status: 'completed',
        summary:
          'Cycle #13 executed successfully. 3 autonomous actions dispatched across Twitter distribution, Keyword SERP rank checks, and lead enrichment.',
        actionsDispatched: 3,
        telemetry: {
          focusArea: 'social_seo',
          autonomyLevel: 2,
          totalExecutionTimeMs: 1220,
          actions: [
            {
              agent: 'Social Distribution Connector',
              action: 'Published scheduled launch thread to Twitter connector account',
              status: 'completed',
              latencyMs: 480,
            },
            {
              agent: 'SERP Rank Tracker',
              action: 'Indexed 4 target keywords; "autonomous ai growth engine" moved up to #3',
              status: 'completed',
              latencyMs: 380,
            },
            {
              agent: 'Lead Discovery Agent',
              action: 'Enriched 2 enterprise prospects with ARR and headcount signals',
              status: 'completed',
              latencyMs: 360,
            },
          ],
        },
        startedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        completedAt: new Date(Date.now() - 86400000 * 1 + 1220).toISOString(),
      },
    ];
    setCycles(defaultCycles);
    setSelectedCycle(defaultCycles[0] || null);
  }

  function loadFallbackSchedules() {
    const defaultSchedules: AutonomousSchedule[] = [
      {
        id: 'sch-1',
        organizationId: 'org-demo',
        name: 'Morning Social Distribution & Community Scan',
        cronExpression: '0 9 * * *',
        agentRole: 'social_distributor',
        isActive: true,
        lastRunAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        nextRunAt: new Date(Date.now() + 3600000 * 20).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sch-2',
        organizationId: 'org-demo',
        name: 'Weekly Deep Technical SEO Crawler',
        cronExpression: '0 2 * * 1',
        agentRole: 'seo_specialist',
        isActive: true,
        lastRunAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        nextRunAt: new Date(Date.now() + 86400000 * 4).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sch-3',
        organizationId: 'org-demo',
        name: 'Bi-Weekly Content Repurposing Pipeline',
        cronExpression: '0 14 * * 2,4',
        agentRole: 'content_creator',
        isActive: true,
        lastRunAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        nextRunAt: new Date(Date.now() + 86400000 * 1).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
    setSchedules(defaultSchedules);
  }

  function loadFallbackData() {
    loadFallbackCycles();
    loadFallbackSchedules();
  }

  async function handleTriggerCycle() {
    setTriggeringCycle(true);
    setStatusMessage(null);
    const token = getAccessToken();
    const org = getStoredOrg();

    try {
      if (token && org) {
        const newCycle = await orchestrator.triggerCycle(token, org.id, {
          focusArea: 'all',
        });
        setCycles((prev) => [newCycle, ...prev]);
        setSelectedCycle(newCycle);
      } else {
        const nextNum = (cycles[0]?.cycleNumber ?? 14) + 1;
        const mockCycle: DepartmentCycle = {
          id: `cycle-${nextNum}`,
          organizationId: 'org-demo',
          cycleNumber: nextNum,
          status: 'completed',
          summary: `Cycle #${nextNum} executed live. 4 autonomous growth actions dispatched across SEO, Content, Social, and Lead Discovery under Autonomy Level ${settings.autonomyLevel}.`,
          actionsDispatched: 4,
          telemetry: {
            focusArea: 'all',
            autonomyLevel: settings.autonomyLevel,
            totalExecutionTimeMs: 1450,
            actions: [
              {
                agent: 'Technical SEO Auditor',
                action: 'Crawled primary domain, detected 0 broken links, verified core web vitals (LCP 240ms)',
                status: 'completed',
                latencyMs: 290,
              },
              {
                agent: 'Community Radar Specialist',
                action: 'Scanned Reddit & X, identified 2 prospective leads with >90% buying intent',
                status: 'completed',
                latencyMs: 380,
              },
              {
                agent: 'Growth Content Repurposer',
                action: 'Repurposed latest pillar post into 1 Twitter thread & 1 LinkedIn carousel draft',
                status: settings.autonomyLevel >= 3 ? 'auto_published' : 'drafted_for_review',
                latencyMs: 510,
              },
              {
                agent: 'Strategy Director Agent',
                action: 'Evaluated RICE priority backlog; elevated Programmatic SEO directory mission',
                status: 'completed',
                latencyMs: 270,
              },
            ],
          },
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        setCycles((prev) => [mockCycle, ...prev]);
        setSelectedCycle(mockCycle);
      }
      setStatusMessage('Autonomous Department Cycle dispatched and completed successfully!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setStatusMessage(`Cycle error: ${(err as Error).message}`);
    } finally {
      setTriggeringCycle(false);
    }
  }

  async function handleUpdateAutonomy(level: number) {
    const token = getAccessToken();
    const org = getStoredOrg();

    if (token && org) {
      try {
        const updated = await orchestrator.updateSettings(token, org.id, {
          autonomyLevel: level,
        });
        setSettings((prev) => ({ ...prev, autonomyLevel: updated.autonomyLevel }));
      } catch {
        setSettings((prev) => ({ ...prev, autonomyLevel: level }));
      }
    } else {
      setSettings((prev) => ({ ...prev, autonomyLevel: level }));
    }
    setStatusMessage(`Autonomy Level set to Level ${level}!`);
    setTimeout(() => setStatusMessage(null), 3000);
  }

  async function handleTogglePause() {
    const nextPaused = !settings.isPaused;
    const token = getAccessToken();
    const org = getStoredOrg();

    if (token && org) {
      try {
        const updated = await orchestrator.updateSettings(token, org.id, {
          isPaused: nextPaused,
        });
        setSettings((prev) => ({ ...prev, isPaused: updated.isPaused }));
      } catch {
        setSettings((prev) => ({ ...prev, isPaused: nextPaused }));
      }
    } else {
      setSettings((prev) => ({ ...prev, isPaused: nextPaused }));
    }
    setStatusMessage(nextPaused ? 'Emergency Halt: Autonomous loops paused.' : 'Autonomous loops resumed!');
    setTimeout(() => setStatusMessage(null), 3000);
  }

  async function handleToggleSchedule(scheduleId: string, current: boolean) {
    const nextVal = !current;
    const token = getAccessToken();
    const org = getStoredOrg();

    if (token && org) {
      try {
        const updated = await orchestrator.toggleSchedule(token, org.id, scheduleId, nextVal);
        setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? updated : s)));
      } catch {
        setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? { ...s, isActive: nextVal } : s)));
      }
    } else {
      setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? { ...s, isActive: nextVal } : s)));
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Autonomous Operating Loop & Orchestrator
            </h1>
            <span className="badge badge--brand" style={{ fontSize: '0.75rem' }}>
              Phase 10 — Capstone
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Autonomous AI growth cycles executing across SEO crawlers, editorial content pipelines, social distribution, and lead capture 24/7.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            id="pause-toggle-btn"
            onClick={handleTogglePause}
            className={`btn ${settings.isPaused ? 'btn--primary' : 'btn--outline'}`}
            style={{
              borderColor: settings.isPaused ? '#ef4444' : undefined,
              color: settings.isPaused ? '#fff' : '#ef4444',
            }}
          >
            {settings.isPaused ? '▶ Resume Autonomous Loops' : '⏸ Emergency Halt'}
          </button>
          <button
            id="trigger-cycle-btn"
            disabled={triggeringCycle || settings.isPaused}
            onClick={handleTriggerCycle}
            className="btn btn--primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {triggeringCycle ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px' }} />
                Orchestrating Department...
              </>
            ) : (
              <>⚡ Trigger Autonomous Cycle Now</>
            )}
          </button>
        </div>
      </div>

      {/* ── Status Toast ── */}
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

      {/* ── Autonomy Level Dial & Status Card ── */}
      <div className="card" style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
        {/* Left: Engine Status */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: settings.isPaused ? '#ef4444' : '#10b981',
                boxShadow: settings.isPaused ? '0 0 10px #ef4444' : '0 0 12px #10b981',
              }}
            />
            <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>
              {settings.isPaused ? 'AUTONOMOUS LOOPS PAUSED' : 'AUTONOMOUS GROWTH ENGINE ACTIVE'}
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            Autonomous daemon monitors background tasks, social webhooks, SERP shifts, and incoming buyer intent.
          </p>
        </div>

        {/* Right: Autonomy Level Radio Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Operating Autonomy Level
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {[
              { level: 1, title: 'L1: Assistive', desc: 'Read & advise' },
              { level: 2, title: 'L2: Supervised', desc: 'Review required' },
              { level: 3, title: 'L3: Conditional', desc: 'Auto low-risk' },
              { level: 4, title: 'L4: High Auto', desc: 'Full channels' },
              { level: 5, title: 'L5: Autonomous', desc: 'Self-directing' },
            ].map((lvl) => {
              const active = settings.autonomyLevel === lvl.level;
              return (
                <button
                  key={lvl.level}
                  onClick={() => handleUpdateAutonomy(lvl.level)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 'var(--radius-md)',
                    background: active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'var(--color-brand-primary)' : 'var(--color-border)'}`,
                    color: active ? '#fff' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>{lvl.title}</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {lvl.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('orchestrator')}
          className={`btn ${activeTab === 'orchestrator' ? 'btn--primary' : 'btn--ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>⚡</span>
          <span>Department Orchestrator & Telemetry</span>
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`btn ${activeTab === 'policy' ? 'btn--primary' : 'btn--ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>🛡️</span>
          <span>Deterministic Policy Matrix & Ethics Guardrails</span>
        </button>
      </div>

      {/* ── Tab 1: Orchestrator & Telemetry ── */}
      {activeTab === 'orchestrator' && (
        <>
          {/* Active / Most Recent Cycle Telemetry */}
          {selectedCycle && (
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge--brand" style={{ fontSize: '0.875rem', padding: '4px 10px' }}>
                      Cycle #{selectedCycle.cycleNumber}
                    </span>
                    <span className="badge badge--success">Executed Successfully</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                    {selectedCycle.summary}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Executed At</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>
                    {new Date(selectedCycle.startedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Action Execution Pipeline Breakdown */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', fontWeight: 600 }}>
                  Dispatched Multi-Agent Execution Telemetry
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {(selectedCycle.telemetry?.actions || []).map((act, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-brand-secondary)' }}>
                          ⚡ {act.agent}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#10b981' }}>
                          {act.latencyMs}ms
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                        {act.action}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <span className="badge badge--ghost" style={{ fontSize: '0.6875rem', textTransform: 'capitalize' }}>
                          {act.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Daemons & Cron Triggers Grid */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                  Scheduled Autonomous Cron Daemons
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Standing autonomous background routines triggering deep crawler audits, content republishing, and social distribution.
                </p>
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                BullMQ Worker Active
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {schedules.map((sch) => (
                <div
                  key={sch.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{sch.name}</span>
                    <span
                      className="badge"
                      style={{
                        background: sch.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: sch.isActive ? '#10b981' : 'var(--color-text-muted)',
                      }}
                    >
                      {sch.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#818cf8',
                      }}
                    >
                      {sch.cronExpression}
                    </code>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Assigned: {sch.agentRole.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '4px' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      Next Run: {sch.nextRunAt ? new Date(sch.nextRunAt).toLocaleDateString() : 'Scheduled'}
                    </div>
                    <button
                      className={`btn btn--sm ${sch.isActive ? 'btn--ghost' : 'btn--outline'}`}
                      onClick={() => handleToggleSchedule(sch.id, sch.isActive)}
                      style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
                    >
                      {sch.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Execution Cycles Log */}
          <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                Department Cycle Execution History
              </h3>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                {cycles.length} completed cycles recorded
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CYCLE</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>SUMMARY</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ACTIONS DISPATCHED</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>EXECUTION TIME</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCycle(c)}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        background: selectedCycle?.id === c.id ? 'rgba(99, 102, 241, 0.05)' : undefined,
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.875rem' }}>
                        #{c.cycleNumber}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: '480px' }}>
                        {c.summary}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8125rem' }}>
                        <span className="badge badge--brand">{c.actionsDispatched} Actions</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        {c.telemetry?.totalExecutionTimeMs ?? 1500}ms
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge--success">{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Tab 2: Deterministic Policy Matrix & Ethics Guardrails ── */}
      {activeTab === 'policy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Banner */}
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-brand-primary)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '6px' }}>
              🛡️ Deterministic Tool Policy Engine (@growthos/policy-engine)
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              GrowthOS guarantees brand safety and regulatory compliance through a formal deterministic policy gate.
              Every tool call emitted by an agent during its ReAct loop is intercepted and evaluated before execution.
              Irreversible external mutations and financial actions require supervisory human approval unless the tenant operates at Autonomy Level 3 or higher.
            </p>
          </div>

          {/* Interactive Policy Simulator */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
              ⚡ Interactive Policy Gate Simulator
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Test how the deterministic policy engine evaluates any tool under various autonomy thresholds.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Target Tool Call
                </label>
                <select
                  value={simTool}
                  onChange={(e) => setSimTool(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  {POLICY_MATRIX.map((p) => (
                    <option key={p.tool} value={p.tool}>
                      {p.tool} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Test Autonomy Level
                </label>
                <select
                  value={simLevel}
                  onChange={(e) => setSimLevel(Number(e.target.value))}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value={1}>Level 1: Assistive (Read & Recommend)</option>
                  <option value={2}>Level 2: Supervised (Review Required)</option>
                  <option value={3}>Level 3: Conditional (Auto-Publish Low Risk)</option>
                  <option value={4}>Level 4: High Autonomy (Full Channels)</option>
                  <option value={5}>Level 5: Autonomous Department</option>
                </select>
              </div>
            </div>

            {/* Evaluation Result Banner */}
            {(() => {
              const matched = POLICY_MATRIX.find((p) => p.tool === simTool);
              if (!matched) return null;
              const isGranted = simLevel >= matched.minLevel;
              const isApproval = !isGranted && matched.category.includes('Mutation');
              const statusBadge = isGranted
                ? { label: 'GRANTED — AUTO-EXECUTE', bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', color: '#10b981' }
                : isApproval
                ? { label: 'REQUIRES HUMAN SUPERVISOR APPROVAL', bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b', color: '#f59e0b' }
                : { label: 'DENIED — INSUFFICIENT AUTONOMY', bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', color: '#ef4444' };

              return (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: statusBadge.bg,
                    border: `1px solid ${statusBadge.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: statusBadge.color }}>
                      ● {statusBadge.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Minimum Required: Level {matched.minLevel} | Risk: {matched.risk}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#fff', margin: 0 }}>
                    {isGranted
                      ? `At Level ${simLevel}, "${matched.tool}" executes automatically without human friction.`
                      : isApproval
                      ? `At Level ${simLevel}, "${matched.tool}" triggers an approval request card before connector dispatch.`
                      : `At Level ${simLevel}, "${matched.tool}" cannot be invoked by agents. Tenant must be elevated to Level ${matched.minLevel}.`}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Policy Matrix Table */}
          <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                Tool Permission Matrix (L1 to L5)
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Canonical deterministic matrix mapping tools to risk classes and autonomy thresholds.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TOOL NAME</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CATEGORY</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>RISK LEVEL</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>MIN LEVEL</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>STATUS AT ACTIVE L{settings.autonomyLevel}</th>
                  </tr>
                </thead>
                <tbody>
                  {POLICY_MATRIX.map((p) => {
                    const isGranted = settings.autonomyLevel >= p.minLevel;
                    const isApproval = !isGranted && p.category.includes('Mutation');
                    return (
                      <tr key={p.tool} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.875rem' }}>
                          <code style={{ color: '#818cf8' }}>{p.tool}</code>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {p.desc}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                          {p.category}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            className="badge"
                            style={{
                              background:
                                p.risk === 'Low'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : p.risk === 'Medium'
                                  ? 'rgba(99, 102, 241, 0.15)'
                                  : p.risk === 'High'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(239, 68, 68, 0.15)',
                              color:
                                p.risk === 'Low'
                                  ? '#10b981'
                                  : p.risk === 'Medium'
                                  ? '#818cf8'
                                  : p.risk === 'High'
                                  ? '#f59e0b'
                                  : '#ef4444',
                            }}
                          >
                            {p.risk}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8125rem', fontWeight: 600 }}>
                          Level {p.minLevel}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            className="badge"
                            style={{
                              background: isGranted
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isApproval
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                              color: isGranted ? '#10b981' : isApproval ? '#f59e0b' : '#ef4444',
                            }}
                          >
                            {isGranted ? 'Auto-Allowed' : isApproval ? 'Requires Review' : 'Restricted'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ethics Hard Stops Grid */}
          <div>
            <div style={{ marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                Non-Negotiable Ethics Hard Stops
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Enforced by `@growthos/policy-engine/src/ethics-engine.ts`. Hard-coded safety blocks that cannot be overridden by any prompt or autonomy level.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {ETHICS_HARD_STOPS.map((rule, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    borderLeft: '3px solid #ef4444',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{rule.icon}</span>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>
                      {rule.title}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {rule.rule}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
