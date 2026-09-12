'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { onboarding, type OnboardingProgress } from '@/lib/api';
import styles from './onboarding.module.css';

const STAGE_LABELS: Record<string, { icon: string; label: string }> = {
  starting: { icon: '⚡', label: 'Initializing pipeline...' },
  website_crawl: { icon: '🌐', label: 'Crawling website' },
  brand_intelligence: { icon: '🧠', label: 'Extracting brand intelligence' },
  update_brain: { icon: '💡', label: 'Building Company Brain' },
  seo_analysis: { icon: '🔍', label: 'Running SEO audit' },
  growth_strategy: { icon: '📈', label: 'Generating growth strategy' },
  create_campaign: { icon: '🎯', label: 'Creating growth missions' },
  queue_content: { icon: '✍️', label: 'Queuing content generation' },
  complete: { icon: '✅', label: 'Ready!' },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { session } = useSession();

  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ projectId: string; mission: string; contentQueued: number } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startAnalysis = useCallback(async () => {
    if (!url || isAnalyzing) return;

    // Validate URL
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      setError('Please enter a valid website URL (e.g. https://yourcompany.com)');
      return;
    }

    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    const orgId = session?.organizationId;
    const token = session?.token;

    if (!orgId || !token) {
      setError('Session expired. Please log in again.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress([]);
    setResult(null);

    // Use SSE stream for real-time progress
    const sseUrl = onboarding.streamUrl(orgId, finalUrl);
    const source = new EventSource(`${sseUrl}&token=${token}`);
    eventSourceRef.current = source;

    source.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as OnboardingProgress & { type?: string; mission?: string; projectId?: string; contentQueued?: number };

        if (data.type === 'done') {
          setResult({
            projectId: data.projectId ?? '',
            mission: data.mission ?? '',
            contentQueued: data.contentQueued ?? 0,
          });
          setIsAnalyzing(false);
          source.close();
          return;
        }

        if (data.type === 'error') {
          setError(data.message ?? 'Analysis failed');
          setIsAnalyzing(false);
          source.close();
          return;
        }

        setProgress((prev) => [...prev, data]);
      } catch {
        // skip parse errors
      }
    };

    source.onerror = () => {
      setError('Connection lost. Please try again.');
      setIsAnalyzing(false);
      source.close();
    };
  }, [url, isAnalyzing, session]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') startAnalysis();
  };

  const latestProgress = progress.at(-1);
  const progressPercent = latestProgress
    ? Math.round((latestProgress.step / latestProgress.totalSteps) * 100)
    : 0;

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.badge}>✨ AUTONOMOUS AI MARKETING OS</div>
        <h1 className={styles.title}>
          Enter your website.<br />
          <span className={styles.titleGradient}>We handle the rest.</span>
        </h1>
        <p className={styles.subtitle}>
          GrowthOS analyzes your brand, generates your growth strategy,
          and deploys a team of AI agents to handle all your marketing — autonomously.
        </p>
      </div>

      {/* Input card */}
      {!result && (
        <div className={styles.inputCard}>
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>🌐</span>
            <input
              id="website-url-input"
              type="url"
              placeholder="https://yourcompany.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAnalyzing}
              className={styles.urlInput}
              autoFocus
            />
            <button
              id="analyze-button"
              onClick={startAnalysis}
              disabled={isAnalyzing || !url}
              className={styles.analyzeBtn}
            >
              {isAnalyzing ? (
                <span className={styles.spinner} />
              ) : (
                '→ Analyze'
              )}
            </button>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              ⚠️ {error}
            </div>
          )}

          {/* Features */}
          <div className={styles.features}>
            {[
              { icon: '🧠', label: 'Company Brain' },
              { icon: '📝', label: 'Content Engine' },
              { icon: '🔍', label: 'SEO Audit' },
              { icon: '📱', label: 'Social Posting' },
              { icon: '🔗', label: 'Backlink Builder' },
              { icon: '📊', label: 'Lead Scoring' },
            ].map((f) => (
              <div key={f.label} className={styles.featureChip}>
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress tracker */}
      {isAnalyzing && (
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <span className={styles.progressTitle}>
              {latestProgress ? (STAGE_LABELS[latestProgress.stage]?.label ?? latestProgress.stage) : 'Initializing...'}
            </span>
            <span className={styles.progressPercent}>{progressPercent}%</span>
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>

          <div className={styles.stepsList}>
            {progress.map((p, i) => (
              <div key={i} className={styles.stepItem}>
                <span className={styles.stepIcon}>
                  {STAGE_LABELS[p.stage]?.icon ?? '⚙️'}
                </span>
                <span className={styles.stepMessage}>{p.message}</span>
                <span className={styles.stepCheck}>✓</span>
              </div>
            ))}
            {isAnalyzing && latestProgress && (
              <div className={styles.stepItemActive}>
                <span className={styles.stepSpinner} />
                <span className={styles.stepMessage}>
                  {latestProgress.message}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success result */}
      {result && (
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🚀</div>
          <h2 className={styles.successTitle}>Your AI Growth Team is Ready!</h2>
          <p className={styles.successMission}>&ldquo;{result.mission}&rdquo;</p>

          <div className={styles.successStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{result.contentQueued}</span>
              <span className={styles.statLabel}>Content pieces queued</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>13</span>
              <span className={styles.statLabel}>AI agents deployed</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>∞</span>
              <span className={styles.statLabel}>Automation workflows</span>
            </div>
          </div>

          <div className={styles.successActions}>
            <button
              id="goto-dashboard-btn"
              onClick={() => router.push('/dashboard')}
              className={styles.primaryBtn}
            >
              Open Dashboard →
            </button>
            <button
              id="goto-agents-btn"
              onClick={() => router.push('/agents')}
              className={styles.secondaryBtn}
            >
              View AI Agents
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
