/**
 * GrowthOS Background Worker
 * ─────────────────────────────────────────────────────────────────────────────
 * Real BullMQ worker with 10 production-grade job handlers.
 * Each handler performs real work — AI inference, DB mutations, API calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import 'dotenv/config';
import pino from 'pino';
import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@growthos/database';
import { getEnv } from '@growthos/config';
import { createModelRouter, type ModelRouter } from '@growthos/ai';
import { createDefaultRegistry, type ToolRegistry } from '@growthos/tools';
import { AgentExecutor } from '@growthos/agent-runtime';

// ── Bootstrap shared services ─────────────────────────────────────────────────
const env = getEnv();

const logger = pino({
  level: env.LOG_LEVEL || 'info',
  ...(env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});

const db = new PrismaClient();

const modelRouter: ModelRouter = createModelRouter({
  OPENAI_API_KEY: env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
  GOOGLE_AI_API_KEY: env.GOOGLE_AI_API_KEY,
});

const toolRegistry: ToolRegistry = createDefaultRegistry({
  serpApiKey: env.SERPAPI_API_KEY,
  braveApiKey: env.BRAVE_SEARCH_API_KEY,
  linkedinAccessToken: env.LINKEDIN_ACCESS_TOKEN,
  twitterBearerToken: env.TWITTER_BEARER_TOKEN,
  twitterAccessToken: env.TWITTER_ACCESS_TOKEN,
  twitterAccessSecret: env.TWITTER_ACCESS_SECRET,
  twitterClientId: env.TWITTER_CLIENT_ID,
  twitterClientSecret: env.TWITTER_CLIENT_SECRET,
  metaPageAccessToken: env.META_PAGE_ACCESS_TOKEN,
  metaInstagramAccountId: env.META_INSTAGRAM_ACCOUNT_ID,
  tiktokAccessToken: env.TIKTOK_ACCESS_TOKEN,
  redditClientId: env.REDDIT_CLIENT_ID,
  redditClientSecret: env.REDDIT_CLIENT_SECRET,
  redditUsername: env.REDDIT_USERNAME,
  redditPassword: env.REDDIT_PASSWORD,
  redditUserAgent: env.REDDIT_USER_AGENT,
});

const agentExecutor = new AgentExecutor({ db, modelRouter, toolRegistry });

const emailTransport = nodemailer.createTransport({
  host: env.SMTP_HOST ?? 'localhost',
  port: env.SMTP_PORT ?? 1025,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

// ── Connection config ─────────────────────────────────────────────────────────
const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379'),
  ...(redisUrl.password ? { password: redisUrl.password } : {}),
};

const QUEUES = [
  'agent_execution',
  'content_generation',
  'social_publish',
  'community_monitoring',
  'lead_scoring',
  'seo_analysis',
  'experiment_execution',
  'crawl',
  'scheduled_jobs',
  'notifications',
] as const;

type QueueName = (typeof QUEUES)[number];
const workers: Worker[] = [];

function createWorker(
  queueName: QueueName,
  handler: (job: Job) => Promise<unknown>,
  concurrency = 3,
): Worker {
  const worker = new Worker(queueName, handler, { connection, concurrency });
  worker.on('completed', (job) => {
    logger.info({ queue: queueName, jobId: job.id }, 'Job completed');
  });
  worker.on('failed', (job, err) => {
    logger.error({ queue: queueName, jobId: job?.id, err: err.message }, 'Job failed');
  });
  workers.push(worker);
  return worker;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. AGENT EXECUTION — Real Gemini-powered ReAct loop
// ══════════════════════════════════════════════════════════════════════════════
createWorker('agent_execution', async (job: Job) => {
  const { agentRunId, organizationId, projectId } = job.data as {
    agentRunId: string;
    organizationId: string;
    projectId?: string | undefined;
  };

  logger.info({ agentRunId, jobId: job.id }, 'Executing agent run');

  const run = await db.agentRun.findUnique({
    where: { id: agentRunId },
    include: { agent: true },
  });

  if (!run) throw new Error(`AgentRun ${agentRunId} not found`);
  if (!run.agent) throw new Error(`Agent not found for run ${agentRunId}`);

  const result = await agentExecutor.execute({
    agentRunId,
    organizationId,
    projectId,
    agent: {
      systemPrompt: run.agent.systemPrompt,
      allowedTools: run.agent.allowedTools as string[],
      preferredModel: run.agent.preferredModel,
      maxSteps: run.agent.maxSteps,
      maxTokens: run.agent.maxTokens,
      temperatureX10: run.agent.temperatureX10,
    },
    goal: run.goal,
    onStep: (step) => {
      logger.debug({ agentRunId, type: step.type, stepIndex: step.stepIndex }, 'Agent step');
    },
  });

  return result;
}, 2);

// ══════════════════════════════════════════════════════════════════════════════
// 2. CONTENT GENERATION — Real Gemini content pipeline
// ══════════════════════════════════════════════════════════════════════════════
createWorker('content_generation', async (job: Job) => {
  const { organizationId, contentItemId, topic, type, targetKeyword, targetAudience, projectId } = job.data as {
    organizationId: string;
    contentItemId?: string | undefined;
    topic: string;
    type: string;
    targetKeyword?: string | undefined;
    targetAudience?: string | undefined;
    projectId?: string | undefined;
  };

  logger.info({ jobId: job.id, topic, type }, 'Generating content with Gemini');

  const brain = await db.companyBrain.findFirst({ where: { organizationId } });
  const brandVoice = brain?.brandVoice ?? 'Clear, technical, authoritative, data-driven.';
  const audience = targetAudience ?? brain?.targetAudience ?? 'Developers and Growth Leaders.';

  const prompt = `You are a Principal Technical Content Strategist. Generate a comprehensive ${type} on: "${topic}".

Target Keyword: "${targetKeyword ?? topic}"
Brand Voice: "${brandVoice}"
Target Audience: "${audience}"

Respond with valid JSON only, no markdown wrapper:
{
  "title": "Compelling headline",
  "content": "Complete Markdown draft with headers, technical explanations, and actionable takeaways (min 800 words)",
  "tldr": "2-3 sentence executive summary",
  "seoTitle": "Under 60 char SEO title",
  "seoDescription": "Under 155 char meta description"
}`;

  const completion = await modelRouter.complete('google/gemini-2.5-flash', {
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 5000,
    temperature: 0.7,
  });

  let generated = {
    title: topic,
    content: completion.text ?? '',
    tldr: '',
    seoTitle: topic.slice(0, 60),
    seoDescription: topic.slice(0, 155),
  };

  try {
    const raw = completion.text ?? '{}';
    const jsonStr = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    generated = { ...generated, ...JSON.parse(jsonStr) as typeof generated };
  } catch { /* use defaults */ }

  await db.usageEvent.create({
    data: {
      organizationId,
      eventType: 'content_generation',
      provider: completion.provider,
      model: completion.model,
      inputTokens: completion.usage.inputTokens,
      outputTokens: completion.usage.outputTokens,
      costUsd: completion.usage.estimatedCostUsd,
    },
  });

  // ContentItem schema: content field (not body), status 'drafting' (not 'draft')
  const slug = generated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);

  if (contentItemId) {
    await db.contentItem.update({
      where: { id: contentItemId },
      data: {
        title: generated.title,
        content: generated.content,
        tldr: generated.tldr,
        seoTitle: generated.seoTitle,
        seoDescription: generated.seoDescription,
        status: 'review',
      },
    });
    return { contentItemId, title: generated.title, status: 'review' };
  }

  // Generate unique slug
  const existing = await db.contentItem.findUnique({
    where: { organizationId_slug: { organizationId, slug } },
  });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const item = await db.contentItem.create({
    data: {
      organizationId,
      projectId: projectId ?? null,
      title: generated.title,
      content: generated.content,
      tldr: generated.tldr,
      type: ['blog_post', 'tweet_thread', 'linkedin_post', 'newsletter', 'changelog'].includes(type)
        ? type
        : 'blog_post',
      status: 'drafting',
      slug: finalSlug,
      targetKeyword: targetKeyword ?? topic,
      seoTitle: generated.seoTitle,
      seoDescription: generated.seoDescription,
    },
  });

  return { contentItemId: item.id, title: item.title, status: 'drafting' };
}, 3);

// ══════════════════════════════════════════════════════════════════════════════
// 3. SOCIAL PUBLISH — Dispatch to real social connector
// ══════════════════════════════════════════════════════════════════════════════
createWorker('social_publish', async (job: Job) => {
  const { contentItemId, platform, organizationId } = job.data as {
    contentItemId: string;
    platform: string;
    organizationId: string;
  };

  logger.info({ jobId: job.id, contentItemId, platform }, 'Publishing to social platform');

  const item = await db.contentItem.findUnique({ where: { id: contentItemId } });
  if (!item) throw new Error(`ContentItem ${contentItemId} not found`);

  let postContent = item.content;
  if (platform === 'twitter' || platform === 'x') {
    postContent = `${item.title}\n\n${item.seoDescription ?? item.content.slice(0, 200)}`;
  } else if (platform === 'linkedin') {
    postContent = `**${item.title}**\n\n${item.seoDescription ?? item.content.slice(0, 600)}`;
  }

  const result = await toolRegistry.call(
    'social_post',
    { platform, content: postContent, hashtags: [] },
    { organizationId, agentRunId: 'worker-social' },
  );

  if (!result.success) {
    logger.warn({ platform, error: result.error }, 'Social post failed — connector not configured');
    return { status: 'failed', error: result.error, platform };
  }

  const postResult = result.data as { externalId: string; postUrl?: string | undefined; status: string };

  await db.contentItem.update({
    where: { id: contentItemId },
    data: { status: 'published', publishedAt: new Date() },
  });

  return { status: 'published', platform, externalId: postResult.externalId, postUrl: postResult.postUrl };
}, 5);

// ══════════════════════════════════════════════════════════════════════════════
// 4. COMMUNITY MONITORING — Real Reddit scanning + Gemini scoring
// ══════════════════════════════════════════════════════════════════════════════
createWorker('community_monitoring', async (job: Job) => {
  const { organizationId, subreddits, keywords } = job.data as {
    organizationId: string;
    subreddits?: string[] | undefined;
    keywords?: string[] | undefined;
  };

  logger.info({ jobId: job.id, organizationId }, 'Scanning community channels');

  const brain = await db.companyBrain.findFirst({ where: { organizationId } });
  // Brain uses `valueProps` (Json) and `positioning` — extract keywords from positioning
  const brainKeywords: string[] = [];
  if (brain?.positioning) brainKeywords.push(...brain.positioning.split(',').map((k: string) => k.trim()).slice(0, 5));

  const searchTerms = keywords ?? brainKeywords;
  const targetSubreddits = subreddits ?? ['startups', 'entrepreneur', 'SaaS', 'marketing'];

  if (searchTerms.length === 0) {
    return { scannedPosts: 0, opportunitiesFound: 0, reason: 'No keywords configured' };
  }

  let opportunitiesFound = 0;
  let scannedPosts = 0;

  for (const subreddit of targetSubreddits.slice(0, 3)) {
    try {
      const resp = await fetch(
        `https://www.reddit.com/r/${subreddit}/new.json?limit=25`,
        {
          headers: {
            'User-Agent': env.REDDIT_USER_AGENT ?? 'GrowthOS/1.0',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!resp.ok) continue;

      type RedditChild = { data: { id: string; title: string; selftext: string; url: string; score: number; num_comments: number } };
      const data = await resp.json() as { data?: { children?: RedditChild[] } };
      const posts = data.data?.children ?? [];
      scannedPosts += posts.length;

      for (const post of posts) {
        const text = `${post.data.title} ${post.data.selftext}`.toLowerCase();
        const isRelevant = searchTerms.some((kw) => text.includes(kw.toLowerCase()));

        if (isRelevant && post.data.num_comments > 2) {
          const scoringPrompt = `Rate the marketing opportunity (0-100) for this Reddit post.

Post: "${post.data.title}"
Content: "${post.data.selftext.slice(0, 300)}"
Keywords: "${searchTerms.slice(0, 5).join(', ')}"

JSON only: { "score": number, "intent": "awareness|consideration|decision|other", "replyIdea": "brief idea" }`;

          try {
            const scoring = await modelRouter.complete('google/gemini-2.5-flash', {
              messages: [{ role: 'user', content: scoringPrompt }],
              maxTokens: 200,
              temperature: 0.3,
            });

            const raw = (scoring.text ?? '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
            const result = JSON.parse(raw) as { score: number; intent: string; replyIdea: string };

            if (result.score > 50) {
              opportunitiesFound++;
              await db.communityInteraction.create({
                data: {
                  organizationId,
                  platform: 'reddit',
                  postUrl: `https://reddit.com${post.data.url}`,
                  author: subreddit,
                  title: post.data.title.slice(0, 200),
                  content: post.data.selftext.slice(0, 1000),
                  intentScore: result.score,
                  replyDraft: result.replyIdea,
                  status: 'unreviewed',
                },
              }).catch(() => { /* ignore errors */ });
            }
          } catch { /* skip scoring failures */ }
        }
      }
    } catch { /* skip failing subreddits */ }
  }

  return { scannedPosts, opportunitiesFound };
}, 2);

// ══════════════════════════════════════════════════════════════════════════════
// 5. LEAD SCORING — Gemini ICP scoring
// ══════════════════════════════════════════════════════════════════════════════
createWorker('lead_scoring', async (job: Job) => {
  const { leadId, organizationId } = job.data as { leadId: string; organizationId: string };

  logger.info({ jobId: job.id, leadId }, 'Scoring lead with Gemini');

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const brain = await db.companyBrain.findFirst({ where: { organizationId } });

  const prompt = `You are a B2B sales expert. Score this lead (0-100) for ICP fit.

ICP Context: ${brain?.positioning ?? 'SaaS companies, 10-500 employees, growth-focused'}
Lead: Name="${lead.name}", Company="${lead.company}", Source="${lead.source}", Notes="${lead.notes ?? 'none'}"

JSON only: { "score": number, "stage": "new|enriching|qualified|outreach|converted|disqualified", "reasoning": "1-2 sentences" }`;

  const completion = await modelRouter.complete('google/gemini-2.5-flash', {
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 300,
    temperature: 0.2,
  });

  let scored = { score: 50, stage: 'new' as const, reasoning: '' };
  try {
    const raw = (completion.text ?? '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(raw) as typeof scored;
    scored = { ...scored, ...parsed };
  } catch { /* use defaults */ }

  const validStages = ['new', 'enriching', 'qualified', 'outreach', 'converted', 'disqualified'] as const;
  type LeadStage = (typeof validStages)[number];
  const safeStage: LeadStage = validStages.includes(scored.stage as LeadStage) ? (scored.stage as LeadStage) : 'new';

  await db.lead.update({
    where: { id: leadId },
    data: {
      score: Math.min(100, Math.max(0, scored.score)),
      stage: safeStage,
      notes: lead.notes ? `${lead.notes}\n\nAI (${new Date().toLocaleDateString()}): ${scored.reasoning}` : scored.reasoning,
    },
  });

  return { leadId, score: scored.score, stage: safeStage };
}, 5);

// ══════════════════════════════════════════════════════════════════════════════
// 6. SEO ANALYSIS — Real crawl + Gemini analysis
// ══════════════════════════════════════════════════════════════════════════════
createWorker('seo_analysis', async (job: Job) => {
  const { targetUrl, organizationId, projectId } = job.data as {
    targetUrl: string;
    organizationId: string;
    projectId?: string | undefined;
  };

  logger.info({ jobId: job.id, targetUrl }, 'Running SEO analysis');

  const crawlResult = await toolRegistry.call(
    'seo_crawl',
    { url: targetUrl, followLinks: false },
    { organizationId, agentRunId: 'worker-seo' },
  );

  if (!crawlResult.success) throw new Error(`SEO crawl failed: ${crawlResult.error}`);

  const crawlData = crawlResult.data as {
    pages: Array<{
      title: string | null;
      metaDescription: string | null;
      canonicalUrl: string | null;
      h1Tags: string[];
      h2Tags: string[];
      issues: Array<{ severity: string; code: string; message: string }>;
      loadTimeMs: number;
    }>;
    summary: { overallScore: number; criticalIssues: number; warningIssues: number };
  };

  const page = crawlData.pages[0];

  // Use Gemini for actionable recommendations
  const analysisPrompt = `SEO audit for ${targetUrl}. Score: ${crawlData.summary.overallScore}/100. Issues: ${JSON.stringify(crawlData.pages[0]?.issues?.slice(0, 5) ?? [])}.

Provide JSON recommendations:
{ "summary": "2 sentences", "topFixes": ["Fix 1", "Fix 2", "Fix 3"], "quickWins": ["Win 1", "Win 2"] }`;

  let recommendations: Record<string, unknown> = {};
  try {
    const aiAnalysis = await modelRouter.complete('google/gemini-2.5-flash', {
      messages: [{ role: 'user', content: analysisPrompt }],
      maxTokens: 600,
      temperature: 0.4,
    });
    const raw = (aiAnalysis.text ?? '{}').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    recommendations = JSON.parse(raw) as typeof recommendations;
  } catch { /* use empty */ }

  // SeoAudit schema: issues (Json), metadata (Json), no recommendations field
  const existingAudit = await db.seoAudit.findFirst({
    where: { organizationId, targetUrl },
  });

  if (existingAudit) {
    await db.seoAudit.update({
      where: { id: existingAudit.id },
      data: {
        overallScore: crawlData.summary.overallScore,
        titleTag: page?.title ?? null,
        metaDescription: page?.metaDescription ?? null,
        canonicalUrl: page?.canonicalUrl ?? null,
        h1Count: page?.h1Tags.length ?? 0,
        h2Count: page?.h2Tags.length ?? 0,
        loadTimeMs: page?.loadTimeMs ?? 0,
        issues: JSON.parse(JSON.stringify(page?.issues ?? [])),
        metadata: JSON.parse(JSON.stringify(recommendations)),
        status: 'completed',
      },
    });
    return { auditId: existingAudit.id, overallScore: crawlData.summary.overallScore };
  }

  const audit = await db.seoAudit.create({
    data: {
      organizationId,
      projectId: projectId ?? null,
      targetUrl,
      overallScore: crawlData.summary.overallScore,
      titleTag: page?.title ?? null,
      metaDescription: page?.metaDescription ?? null,
      canonicalUrl: page?.canonicalUrl ?? null,
      h1Count: page?.h1Tags.length ?? 0,
      h2Count: page?.h2Tags.length ?? 0,
      loadTimeMs: page?.loadTimeMs ?? 0,
      issues: JSON.parse(JSON.stringify(page?.issues ?? [])),
      metadata: JSON.parse(JSON.stringify(recommendations)),
      status: 'completed',
    },
  });

  return {
    auditId: audit.id,
    overallScore: crawlData.summary.overallScore,
    criticalIssues: crawlData.summary.criticalIssues,
  };
}, 3);

// ══════════════════════════════════════════════════════════════════════════════
// 7. EXPERIMENT EXECUTION — Statistical confidence calculation
// ══════════════════════════════════════════════════════════════════════════════
createWorker('experiment_execution', async (job: Job) => {
  const { experimentId, organizationId } = job.data as {
    experimentId?: string | undefined;
    organizationId: string;
  };

  logger.info({ jobId: job.id, experimentId }, 'Recalculating experiment statistics');

  // GrowthExperiment stores variants as Json, no separate ExperimentVariant model
  const where = experimentId
    ? { id: experimentId, organizationId }
    : { organizationId, status: 'running' };

  const experiments = await db.growthExperiment.findMany({ where });

  for (const exp of experiments) {
    const variantsData = Array.isArray(exp.variants) ? exp.variants : [];

    let maxConvRate = 0;
    let winnerName = '';

    const updatedVariants = variantsData.map((v: unknown) => {
      const variant = v as { id?: string; name?: string; impressions?: number; conversions?: number; conversionRate?: number };
      const n = variant.impressions ?? 0;
      const c = variant.conversions ?? 0;
      const rate = n > 0 ? c / n : 0;
      if (rate > maxConvRate) {
        maxConvRate = rate;
        winnerName = variant.name ?? '';
      }
      return { ...variant, conversionRate: parseFloat(rate.toFixed(4)) };
    });

    // Simple confidence: if one variant has >5% higher rate, assign 95% confidence
    const rates = updatedVariants.map((v) => v.conversionRate ?? 0);
    const maxRate = Math.max(...rates);
    const secondMax = rates.filter(r => r < maxRate)[0] ?? 0;
    const confidence = maxRate - secondMax > 0.05 ? 95.0 : 50.0;

    await db.growthExperiment.update({
      where: { id: exp.id },
      data: {
        variants: JSON.parse(JSON.stringify(updatedVariants)),
        confidence,
        winningVariant: confidence > 90 ? winnerName : null,
      },
    });
  }

  return { updated: experiments.length };
}, 5);

// ══════════════════════════════════════════════════════════════════════════════
// 8. CRAWL (Company Brain) — Using KnowledgeSource + KnowledgeChunk models
// ══════════════════════════════════════════════════════════════════════════════
createWorker('crawl', async (job: Job) => {
  const { url, organizationId, projectId } = job.data as {
    url: string;
    organizationId: string;
    projectId?: string | undefined;
  };

  logger.info({ jobId: job.id, url }, 'Crawling URL for knowledge base');

  const fetchResult = await toolRegistry.call(
    'fetch_url',
    { url, extractText: true },
    { organizationId, agentRunId: 'worker-crawl' },
  );

  if (!fetchResult.success) throw new Error(`Crawl failed for ${url}: ${fetchResult.error}`);

  const fetchData = fetchResult.data as { text?: string | undefined; title?: string | undefined };
  const text = fetchData.text ?? '';
  const title = fetchData.title ?? url;

  if (!text || text.length < 100) {
    return { chunksCreated: 0, tokens: 0, reason: 'Insufficient text content' };
  }

  // Create or find KnowledgeSource
  let source = await db.knowledgeSource.findFirst({
    where: { organizationId, sourceUrl: url },
  });

  if (!source) {
    source = await db.knowledgeSource.create({
      data: {
        organizationId,
        projectId: projectId ?? null,
        type: 'url',
        sourceUrl: url,
        title,
        status: 'crawling',
      },
    });
  }

  // Create KnowledgeDocument
  const doc = await db.knowledgeDocument.create({
    data: {
      sourceId: source.id,
      organizationId,
      title,
      content: text,
      contentType: 'text/plain',
      tokenCount: Math.ceil(text.length / 4),
    },
  });

  // Chunk and create KnowledgeChunks
  const CHUNK_SIZE = 4000;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    const chunk = text.slice(i, i + CHUNK_SIZE).trim();
    if (chunk.length > 50) chunks.push(chunk);
  }

  let totalTokens = 0;
  let createdChunks = 0;

  for (const [idx, chunk] of chunks.slice(0, 20).entries()) {
    try {
      const summaryPrompt = `Extract key facts (2-3 sentences) from:\n${chunk}`;
      const summary = await modelRouter.complete('google/gemini-2.5-flash', {
        messages: [{ role: 'user', content: summaryPrompt }],
        maxTokens: 200,
        temperature: 0.1,
      });

      totalTokens += summary.usage.inputTokens + summary.usage.outputTokens;

      await db.knowledgeChunk.create({
        data: {
          documentId: doc.id,
          organizationId,
          chunkIndex: idx,
          content: chunk,
          tokenCount: Math.ceil(chunk.length / 4),
          metadata: { summary: summary.text ?? '' },
        },
      });
      createdChunks++;
    } catch { /* skip failed chunks */ }
  }

  // Mark source as ready
  await db.knowledgeSource.update({
    where: { id: source.id },
    data: { status: 'ready', lastCrawledAt: new Date() },
  });

  return { chunksCreated: createdChunks, tokens: totalTokens, sourceUrl: url };
}, 2);

// ══════════════════════════════════════════════════════════════════════════════
// 9. SCHEDULED JOBS — Cron trigger dispatcher
// ══════════════════════════════════════════════════════════════════════════════
createWorker('scheduled_jobs', async (job: Job) => {
  const { name, organizationId } = job.data as { name: string; organizationId?: string | undefined };

  logger.info({ jobId: job.id, name, organizationId }, 'Executing scheduled job');

  const { Queue } = await import('bullmq');

  switch (name) {
    case 'daily_community_scan': {
      const orgs = organizationId
        ? [{ id: organizationId }]
        : await db.organization.findMany({ select: { id: true } });

      const q = new Queue('community_monitoring', { connection });
      for (const org of orgs) {
        await q.add('scan', { organizationId: org.id }, { attempts: 2 });
      }
      await q.close();
      return { triggered: orgs.length };
    }

    case 'daily_lead_scoring': {
      const leads = await db.lead.findMany({
        where: {
          ...(organizationId ? { organizationId } : {}),
          score: { lt: 50 },
        },
        select: { id: true, organizationId: true },
        take: 50,
      });

      const q = new Queue('lead_scoring', { connection });
      for (const lead of leads) {
        await q.add('score', { leadId: lead.id, organizationId: lead.organizationId }, { attempts: 2 });
      }
      await q.close();
      return { triggered: leads.length };
    }

    case 'weekly_seo_audit': {
      const projects = await db.project.findMany({
        where: {
          ...(organizationId ? { organizationId } : {}),
          websiteUrl: { not: null },
        },
        select: { id: true, organizationId: true, websiteUrl: true },
        take: 10,
      });

      const q = new Queue('seo_analysis', { connection });
      for (const proj of projects) {
        if (proj.websiteUrl) {
          await q.add('audit', {
            targetUrl: proj.websiteUrl,
            organizationId: proj.organizationId,
            projectId: proj.id,
          }, { attempts: 2 });
        }
      }
      await q.close();
      return { triggered: projects.length };
    }

    default:
      logger.warn({ name }, 'Unknown scheduled job name');
      return { triggered: 0, reason: `Unknown: ${name}` };
  }
}, 2);

// ══════════════════════════════════════════════════════════════════════════════
// 10. NOTIFICATIONS — Real email via Nodemailer
// ══════════════════════════════════════════════════════════════════════════════
createWorker('notifications', async (job: Job) => {
  const { email, subject, html, text } = job.data as {
    email: string;
    subject: string;
    html?: string | undefined;
    text?: string | undefined;
    type?: string | undefined;
  };

  logger.info({ jobId: job.id, email }, 'Sending notification email');

  const emailHtml = html ?? `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Inter, sans-serif; background: #0a0a0f; color: #e2e8f0; padding: 40px; }
    .card { background: #1a1a2e; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; }
    h1 { color: #a78bfa; margin-top: 0; }
    p { color: #94a3b8; line-height: 1.6; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #2563eb); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 GrowthOS</h1>
    <p>${text ?? subject}</p>
    <br />
    <a href="${env.APP_URL}" class="btn">Open GrowthOS →</a>
  </div>
</body>
</html>`;

  const info = await emailTransport.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject,
    text: text ?? subject,
    html: emailHtml,
  });

  return { delivered: true, messageId: info.messageId };
}, 10);

// ── Startup ───────────────────────────────────────────────────────────────────
logger.info({ queues: QUEUES.length }, '🚀 GrowthOS Worker started — all queues online');

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = async () => {
  logger.info('Shutting down workers...');
  await Promise.all(workers.map((w) => w.close()));
  await db.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
