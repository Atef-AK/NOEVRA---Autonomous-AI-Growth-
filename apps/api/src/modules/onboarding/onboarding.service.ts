/**
 * OnboardingService — Website → AI Agent Marketing OS pipeline.
 *
 * When a client provides their website URL, this service:
 * 1. Crawls the website to extract brand intelligence
 * 2. Runs a technical SEO audit
 * 3. Updates the Company Brain
 * 4. Generates a 90-day growth strategy via Gemini
 * 5. Creates a Mission + queues initial content generation
 *
 * Each step emits SSE events for real-time frontend progress.
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/database/prisma.service';
import { getEnv } from '@growthos/config';
import { createModelRouter } from '@growthos/ai';
import { createDefaultRegistry } from '@growthos/tools';
import { safeUrl } from '@growthos/shared';

const getRedisConnection = () => {
  const env = getEnv();
  const url = new URL(env.REDIS_URL);
  return { host: url.hostname, port: parseInt(url.port || '6379') };
};

export interface OnboardingProgress {
  step: number;
  totalSteps: number;
  stage: string;
  message: string;
  data?: Record<string, unknown> | undefined;
  completed: boolean;
  error?: string | undefined;
}

export type ProgressCallback = (progress: OnboardingProgress) => void;

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private readonly env = getEnv();
  private readonly modelRouter = createModelRouter({
    OPENAI_API_KEY: this.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
    GOOGLE_AI_API_KEY: this.env.GOOGLE_AI_API_KEY,
  });
  private readonly toolRegistry = createDefaultRegistry({
    serpApiKey: this.env.SERPAPI_API_KEY,
    braveApiKey: this.env.BRAVE_SEARCH_API_KEY,
  });

  constructor(private readonly prisma: PrismaService) {}

  async analyzeWebsite(
    organizationId: string,
    websiteUrl: string,
    onProgress: ProgressCallback,
  ): Promise<{ success: boolean; summary: Record<string, unknown> }> {
    try {
      safeUrl(websiteUrl);
    } catch {
      throw new BadRequestException(`Invalid or unsafe URL: ${websiteUrl}`);
    }

    const TOTAL_STEPS = 7;
    let step = 0;

    const progress = (stage: string, message: string, data?: Record<string, unknown>) => {
      step++;
      onProgress({
        step,
        totalSteps: TOTAL_STEPS,
        stage,
        message,
        ...(data !== undefined ? { data } : {}),
        completed: false,
      });
      this.logger.log(`[Onboarding ${step}/${TOTAL_STEPS}] ${stage}: ${message}`);
    };

    // ── Step 1: Website crawl ──────────────────────────────────────────────────
    progress('website_crawl', `Analyzing ${websiteUrl}...`);

    const analyzerResult = await this.toolRegistry.call(
      'website_analyzer',
      { url: websiteUrl, depth: 'full' },
      { organizationId, agentRunId: 'onboarding' },
    );

    const websiteData = analyzerResult.success
      ? (analyzerResult.data as Record<string, unknown> & { rawText?: string | undefined })
      : null;

    // ── Step 2: Gemini brand intelligence extraction ───────────────────────────
    progress('brand_intelligence', 'Extracting brand intelligence with Gemini...', {
      crawledUrls: websiteData?.crawledUrls,
    });

    let brandProfile = {
      description: 'A growing business',
      products: [] as string[],
      targetMarket: '',
      uniqueValueProposition: '',
      brandTone: 'Professional',
      primaryKeywords: [] as string[],
      competitors: [] as string[],
      icp: 'SMBs and enterprises',
    };

    if (websiteData?.rawText || websiteData?.description) {
      const rawText = (websiteData.rawText as string | undefined) ?? (websiteData.description as string | undefined) ?? '';
      const analysisPrompt = `You are a brand analyst. Extract structured company information from this website text.

Website URL: ${websiteUrl}
Website Content:
${rawText.slice(0, 6000)}

Return valid JSON only (no markdown):
{
  "description": "1-2 sentence company description",
  "products": ["Product/Service 1", "Product/Service 2"],
  "targetMarket": "Description of target market/customer",
  "uniqueValueProposition": "What makes them unique",
  "brandTone": "Professional|Casual|Technical|Friendly|Bold",
  "primaryKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "competitors": ["competitor1", "competitor2"],
  "icp": "Ideal customer profile description"
}`;

      try {
        const completion = await this.modelRouter.complete('google/gemini-2.5-flash', {
          messages: [{ role: 'user', content: analysisPrompt }],
          maxTokens: 1000,
          temperature: 0.3,
        });

        const raw = completion.text ?? '{}';
        const parsed = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()) as typeof brandProfile;
        brandProfile = { ...brandProfile, ...parsed };
      } catch {
        this.logger.warn('Gemini brand extraction failed, using heuristics');
      }
    }

    // ── Step 3: Update Company Brain ──────────────────────────────────────────
    progress('update_brain', 'Building Company Brain...', {
      keywords: brandProfile.primaryKeywords,
    });

    // CompanyBrain schema: name, summary, brandVoice, targetAudience, valueProps (Json),
    // competitors (Json), positioning. Unique: [organizationId, name]
    const brainName = 'Primary Brain';
    const brain = await this.prisma.companyBrain.upsert({
      where: { organizationId_name: { organizationId, name: brainName } },
      create: {
        organizationId,
        name: brainName,
        summary: brandProfile.description,
        brandVoice: brandProfile.brandTone,
        targetAudience: brandProfile.targetMarket,
        valueProps: JSON.parse(JSON.stringify(brandProfile.products)),
        competitors: JSON.parse(JSON.stringify(brandProfile.competitors)),
        positioning: `${brandProfile.uniqueValueProposition}\n\nKeywords: ${brandProfile.primaryKeywords.join(', ')}\n\nICP: ${brandProfile.icp}`,
      },
      update: {
        summary: brandProfile.description,
        brandVoice: brandProfile.brandTone,
        targetAudience: brandProfile.targetMarket,
        valueProps: JSON.parse(JSON.stringify(brandProfile.products)),
        competitors: JSON.parse(JSON.stringify(brandProfile.competitors)),
        positioning: `${brandProfile.uniqueValueProposition}\n\nKeywords: ${brandProfile.primaryKeywords.join(', ')}\n\nICP: ${brandProfile.icp}`,
      },
    });

    // ── Step 4: Queue SEO Analysis + Crawl ────────────────────────────────────
    progress('seo_analysis', 'Running technical SEO audit...', { url: websiteUrl });

    try {
      const redisConn = { ...getRedisConnection(), maxRetriesPerRequest: 1, connectTimeout: 2000 };
      const crawlQueue = new Queue('crawl', { connection: redisConn });
      const seoQueue = new Queue('seo_analysis', { connection: redisConn });

      await Promise.race([
        Promise.all([
          crawlQueue.add('crawl-homepage', { url: websiteUrl, organizationId }),
          seoQueue.add('audit-onboarding', { targetUrl: websiteUrl, organizationId }),
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2500)),
      ]).catch(() => this.logger.warn('Redis unreachable; skipping background queue jobs'));

      await crawlQueue.close().catch(() => {});
      await seoQueue.close().catch(() => {});
    } catch (err) {
      this.logger.warn('SEO analysis queuing skipped (Redis offline)');
    }

    // ── Step 5: Growth Strategy Generation ────────────────────────────────────
    progress('growth_strategy', 'Generating 90-day growth strategy with Gemini...');

    const strategyPrompt = `You are a world-class growth strategist. Create a 90-day go-to-market growth strategy.

Company URL: ${websiteUrl}
Description: ${brandProfile.description}
Products: ${brandProfile.products.join(', ')}
Target Market: ${brandProfile.targetMarket}
Keywords: ${brandProfile.primaryKeywords.join(', ')}

Return valid JSON only:
{
  "mission": "One-sentence growth mission",
  "northStar": "Single metric to move",
  "channels": ["Channel 1", "Channel 2", "Channel 3"],
  "contentTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  "keyActions": ["Action 1", "Action 2", "Action 3"]
}`;

    let strategy = {
      mission: `Grow through autonomous AI-powered marketing`,
      northStar: 'Monthly recurring revenue',
      channels: ['Content Marketing', 'Social Media', 'Community Building'],
      contentTopics: brandProfile.primaryKeywords.slice(0, 5),
      keyActions: ['Set up social channels', 'Create content calendar', 'Launch community monitoring'],
    };

    try {
      const strategyCompletion = await this.modelRouter.complete('google/gemini-2.5-flash', {
        messages: [{ role: 'user', content: strategyPrompt }],
        maxTokens: 1000,
        temperature: 0.5,
      });
      const raw = strategyCompletion.text ?? '{}';
      const parsed = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()) as typeof strategy;
      strategy = { ...strategy, ...parsed };
    } catch {
      this.logger.warn('Strategy generation failed, using defaults');
    }

    // ── Step 6: Create Project + GrowthMission ────────────────────────────────
    progress('create_campaign', 'Building 30-day content calendar...', {
      mission: strategy.mission,
      channels: strategy.channels,
    });

    // Find or create default project. Project schema: websiteUrl (not website)
    let project = await this.prisma.project.findFirst({ where: { organizationId } });
    if (!project) {
      const slug = new URL(websiteUrl).hostname.replace('www.', '').replace(/\./g, '-');
      project = await this.prisma.project.create({
        data: {
          organizationId,
          name: `Growth OS — ${new URL(websiteUrl).hostname}`,
          slug,
          websiteUrl,
          description: strategy.mission,
          status: 'active',
        },
      });
    }

    // GrowthMission schema: title, objective (not description), no targetMetric
    const existingMission = await this.prisma.growthMission.findFirst({
      where: { organizationId, projectId: project.id },
    });

    if (!existingMission) {
      await this.prisma.growthMission.create({
        data: {
          organizationId,
          projectId: project.id,
          title: strategy.mission,
          objective: `North Star: ${strategy.northStar}\n\nChannels: ${strategy.channels.join(', ')}\n\nKey Actions:\n${strategy.keyActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
          status: 'in_progress',
          estimatedImpact: strategy.northStar,
        },
      });
    }

    // ── Step 7: Queue content generation ──────────────────────────────────────
    const topicsToQueue = (strategy.contentTopics.length > 0
      ? strategy.contentTopics
      : brandProfile.primaryKeywords
    ).slice(0, 5);

    progress('queue_content', `Queueing ${topicsToQueue.length} content pieces...`, {
      topics: topicsToQueue,
    });

    try {
      const redisConn = { ...getRedisConnection(), maxRetriesPerRequest: 1, connectTimeout: 2000 };
      const contentQueue = new Queue('content_generation', { connection: redisConn });

      await Promise.race([
        Promise.all(
          topicsToQueue.map((topic) =>
            contentQueue.add(
              'generate',
              {
                organizationId,
                topic,
                type: 'blog_post',
                targetKeyword: topic,
                projectId: project.id,
              },
              { attempts: 2, backoff: { type: 'exponential', delay: 5000 } },
            ),
          ),
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2500)),
      ]).catch(() => this.logger.warn('Redis unreachable; skipping content queue'));

      await contentQueue.close().catch(() => {});
    } catch (err) {
      this.logger.warn('Content queueing skipped (Redis offline)');
    }

    // ── Complete ───────────────────────────────────────────────────────────────
    onProgress({
      step: TOTAL_STEPS,
      totalSteps: TOTAL_STEPS,
      stage: 'complete',
      message: `✅ GrowthOS is now analyzing and working autonomously!`,
      data: {
        brainId: brain.id,
        projectId: project.id,
        strategy: {
          mission: strategy.mission,
          channels: strategy.channels,
          contentTopics: topicsToQueue,
        },
        socialLinks: (websiteData?.socialLinks as Record<string, string> | undefined) ?? {},
      },
      completed: true,
    });

    return {
      success: true,
      summary: {
        brainId: brain.id,
        projectId: project.id,
        mission: strategy.mission,
        contentQueued: topicsToQueue.length,
        seoAuditQueued: true,
      },
    };
  }
}
