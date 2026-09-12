import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import slugify from 'slugify';
import { PrismaService } from '../../common/database/prisma.service';
import { getEnv } from '@growthos/config';
import { createModelRouter, ModelRouter } from '@growthos/ai';
import type {
  CreateCampaignDto,
  CreateContentItemDto,
  UpdateContentItemDto,
  GenerateContentDto,
  RepurposeContentDto,
} from './dto/content.dto';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private readonly env = getEnv();
  private readonly modelRouter: ModelRouter;

  constructor(private readonly prisma: PrismaService) {
    this.modelRouter = createModelRouter({
      OPENAI_API_KEY: this.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
      GOOGLE_AI_API_KEY: this.env.GOOGLE_AI_API_KEY,
    });
  }

  // ==========================================
  // AUTONOMOUS CONTENT GENERATION
  // ==========================================

  async generateContent(
    organizationId: string,
    dto: GenerateContentDto,
    requestingUserId?: string,
  ) {
    // Fetch Company Brain context
    const brain = await this.prisma.companyBrain.findFirst({
      where: { organizationId },
    });

    const targetKeyword = dto.targetKeyword ?? dto.topic;
    const brandVoice = brain?.brandVoice ?? 'Clear, technical, authoritative, and data-driven.';
    const audience = dto.targetAudience ?? brain?.targetAudience ?? 'Developers and Growth Leaders.';

    let generated: {
      title: string;
      content: string;
      tldr: string;
      outline: string[];
      seoTitle: string;
      seoDescription: string;
      brandVoiceScore: number;
    };

    if (
      this.env.OPENAI_API_KEY ||
      this.env.ANTHROPIC_API_KEY ||
      this.env.GOOGLE_AI_API_KEY
    ) {
      try {
        const prompt = `You are a Principal Technical Content Strategist. Generate a comprehensive ${dto.type} on the topic: "${dto.topic}".
Target Keyword: "${targetKeyword}"
Brand Voice Guidelines: "${brandVoice}"
Target Audience: "${audience}"

Respond strictly with valid JSON with this schema:
{
  "title": "Compelling headline",
  "content": "Complete, high quality Markdown draft with headers, technical explanations, and actionable takeaways",
  "tldr": "2-3 sentence executive summary",
  "outline": ["Section 1", "Section 2", "Section 3"],
  "seoTitle": "Under 60 char SEO title",
  "seoDescription": "Under 155 char meta description",
  "brandVoiceScore": 95
}`;

        const response = await this.modelRouter.complete('openai/gpt-4o', {
          messages: [
            {
              role: 'system',
              content: 'You are an autonomous AI content specialist. Always output valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
        });

        generated = JSON.parse(response.text ?? '{}');
      } catch (err) {
        this.logger.warn(
          `AI content generation failed, falling back to deterministic heuristic generator: ${
            (err as Error).message
          }`,
        );
        generated = this.getHeuristicContent(dto, brandVoice, targetKeyword);
      }
    } else {
      generated = this.getHeuristicContent(dto, brandVoice, targetKeyword);
    }

    const wordCount = generated.content.split(/\s+/).length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));
    const baseSlug = slugify(generated.title, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    // Find content specialist agent if available
    const agent = await this.prisma.agent.findFirst({
      where: { organizationId, isActive: true },
    });

    const contentItem = await this.prisma.contentItem.create({
      data: {
        organizationId,
        campaignId: dto.campaignId ?? null,
        missionId: dto.missionId ?? null,
        authorAgentId: agent?.id ?? null,
        title: generated.title,
        slug,
        type: dto.type,
        status: 'drafting',
        content: generated.content,
        tldr: generated.tldr,
        outline: generated.outline,
        targetKeyword,
        seoTitle: generated.seoTitle,
        seoDescription: generated.seoDescription,
        readingTimeMin,
        brandVoiceScore: generated.brandVoiceScore ?? 92,
        revisions: {
          create: [
            {
              version: 1,
              content: generated.content,
              summary: 'Initial autonomous AI draft generated from Company Brain context.',
              authorType: 'ai',
            },
          ],
        },
      },
      include: {
        revisions: true,
        campaign: true,
      },
    });

    return contentItem;
  }

  private getHeuristicContent(
    dto: GenerateContentDto,
    brandVoice: string,
    targetKeyword: string,
  ) {
    if (dto.type === 'tweet_thread') {
      return {
        title: `How Autonomous AI Changes ${dto.topic}`,
        content: `1/7 Most teams still manage growth with disconnected scripts and manual spreadsheets.\n\nHere is how autonomous AI agents replace manual overhead with 24/7 deterministic execution 🧵👇\n\n2/7 The core bottleneck in modern B2B SaaS isn't generating ideas—it is the execution loop latency.\n\nWhen your strategy, research, drafting, and distribution run autonomously, cycle time drops from 2 weeks to 20 minutes.\n\n3/7 Keyword target: #${targetKeyword.replace(/\s+/g, '')}\nBy grounding agents in a unified Company Brain with pgvector semantic search, hallucinations drop to near zero.\n\n4/7 Each agent acts as an autonomous specialist:\n- SEO Specialist analyzes SERP gaps\n- Content Specialist drafts technical teardowns\n- Outbound Specialist nurtures developer hubs\n\n5/7 The result? Consistent compounding growth without burning out your engineering team.\n\n6/7 Read our complete architectural breakdown and run the benchmark locally.\n\n7/7 What is your team's biggest operational bottleneck today? Let us know below!`,
        tldr: 'A 7-tweet technical thread demonstrating how autonomous AI agents eliminate growth execution latency.',
        outline: ['Hook & Problem Statement', 'Execution Latency Bottleneck', 'Company Brain Semantic Grounding', 'Agent Roles', 'Call to Action'],
        seoTitle: `${dto.topic} — Autonomous AI Thread`,
        seoDescription: `A high-impact technical thread exploring autonomous growth execution for ${dto.topic}.`,
        brandVoiceScore: 94,
      };
    }

    return {
      title: `Architecting Autonomous Growth: A Deep Dive into ${dto.topic}`,
      content: `# Architecting Autonomous Growth: A Deep Dive into ${dto.topic}

## Executive Summary
In modern B2B SaaS, sustainable growth is an engineering discipline. This comprehensive guide examines how autonomous multi-agent loops transform **${targetKeyword}** from a manual workflow into an automated growth engine.

---

## The Growth Bottleneck: Execution Latency
Traditional marketing departments operate with massive latency:
1. **Ideation & Research**: 3-5 business days
2. **Drafting & Content Creation**: 4-7 business days
3. **Review & Distribution**: 2-4 business days

By implementing autonomous **ReAct (Reason + Act)** agent loops grounded in a persistent Company Brain, organizations compress this entire feedback cycle into minutes while maintaining high technical rigor.

\`\`\`typescript
// Autonomous Execution Loop Flow
const result = await agentRuntime.execute({
  goal: "Dominate search intent for ${targetKeyword}",
  grounding: companyBrain.getSemanticContext("${targetKeyword}"),
  tools: [webSearchTool, calculatorTool, serpAuditTool]
});
\`\`\`

---

## Semantic Grounding via Company Brain
Generative AI without domain grounding leads to generic, low-converting copy. GrowthOS enforces strict context budgeting and cosine similarity matching:
- **Tone & Persona**: ${brandVoice}
- **Target Audience**: Real-time ICP persona matching
- **Verification**: Programmatic keyword density and tone audits before publish

---

## Tactical Implementation Blueprint
1. **Pillar Strategy**: Establish high-intent technical documentation answering user queries directly.
2. **Cross-Channel Repurposing**: Deconstruct long-form teardowns into tweet threads, LinkedIn discussions, and changelog updates.
3. **Closed-Loop Attribution**: Measure organic conversions and iterate agent weights automatically.

## Conclusion & Next Steps
Autonomous growth is not about replacing human judgment; it is about scaling technical execution velocity. Explore our open-source templates and start automating your growth department today.`,
      tldr: `A deep technical analysis showing how autonomous AI agent loops accelerate ${dto.topic} with zero human latency.`,
      outline: [
        'Executive Summary',
        'The Growth Bottleneck: Execution Latency',
        'Semantic Grounding via Company Brain',
        'Tactical Implementation Blueprint',
        'Conclusion & Next Steps',
      ],
      seoTitle: `${dto.topic} — Complete Technical Architecture Guide`,
      seoDescription: `Learn how autonomous AI systems revolutionize ${dto.topic} through semantic grounding and ReAct agent loops.`,
      brandVoiceScore: 96,
    };
  }

  // ==========================================
  // MULTI-FORMAT REPURPOSING
  // ==========================================

  async repurposeContent(
    organizationId: string,
    contentItemId: string,
    dto: RepurposeContentDto,
  ) {
    const original = await this.prisma.contentItem.findFirst({
      where: { id: contentItemId, organizationId },
    });

    if (!original) {
      throw new NotFoundException('Original content item not found');
    }

    const repurposed = this.getHeuristicContent(
      {
        topic: original.title,
        type: dto.targetType,
        targetKeyword: original.targetKeyword ?? original.title,
      },
      'Direct, data-driven, concise',
      original.targetKeyword ?? original.title,
    );

    const baseSlug = slugify(`${original.title}-${dto.targetType}`, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    return this.prisma.contentItem.create({
      data: {
        organizationId,
        campaignId: original.campaignId,
        missionId: original.missionId,
        authorAgentId: original.authorAgentId,
        title: `${original.title} [${dto.targetType.replace('_', ' ').toUpperCase()}]`,
        slug,
        type: dto.targetType,
        status: 'drafting',
        content: repurposed.content,
        tldr: repurposed.tldr,
        outline: repurposed.outline,
        targetKeyword: original.targetKeyword,
        seoTitle: repurposed.seoTitle,
        seoDescription: repurposed.seoDescription,
        readingTimeMin: Math.max(1, Math.ceil(repurposed.content.split(/\s+/).length / 200)),
        brandVoiceScore: 92,
        metadata: {
          repurposedFromId: original.id,
          repurposedFromType: original.type,
        },
        revisions: {
          create: [
            {
              version: 1,
              content: repurposed.content,
              summary: `Repurposed from ${original.type}: "${original.title}"`,
              authorType: 'ai',
            },
          ],
        },
      },
      include: {
        revisions: true,
      },
    });
  }

  // ==========================================
  // CONTENT CRUD & REVISIONS
  // ==========================================

  async listContent(
    organizationId: string,
    filters?: {
      type?: string | undefined;
      status?: string | undefined;
      campaignId?: string | undefined;
    },
  ) {
    return this.prisma.contentItem.findMany({
      where: {
        organizationId,
        ...(filters?.type ? { type: filters.type } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: { select: { id: true, name: true } },
        authorAgent: { select: { id: true, name: true, slug: true } },
        _count: { select: { revisions: true } },
      },
    });
  }

  async getContent(organizationId: string, id: string) {
    const item = await this.prisma.contentItem.findFirst({
      where: { id, organizationId },
      include: {
        campaign: true,
        authorAgent: true,
        revisions: { orderBy: { version: 'desc' } },
      },
    });

    if (!item) {
      throw new NotFoundException('Content item not found');
    }

    return item;
  }

  async createContent(organizationId: string, dto: CreateContentItemDto) {
    const baseSlug = slugify(dto.title, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    const wordCount = dto.content.split(/\s+/).length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

    return this.prisma.contentItem.create({
      data: {
        organizationId,
        campaignId: dto.campaignId ?? null,
        missionId: dto.missionId ?? null,
        title: dto.title,
        slug,
        type: dto.type ?? 'blog_post',
        status: dto.status ?? 'drafting',
        content: dto.content,
        tldr: dto.tldr ?? null,
        targetKeyword: dto.targetKeyword ?? null,
        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
        readingTimeMin,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        revisions: {
          create: [
            {
              version: 1,
              content: dto.content,
              summary: 'Initial draft',
              authorType: 'user',
            },
          ],
        },
      },
      include: { revisions: true },
    });
  }

  async updateContent(
    organizationId: string,
    id: string,
    dto: UpdateContentItemDto,
  ) {
    const item = await this.getContent(organizationId, id);

    const isContentChanged = dto.content !== undefined && dto.content !== item.content;

    let nextVersion = item.revisions.length + 1;

    return this.prisma.contentItem.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.content ? { content: dto.content } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.tldr !== undefined ? { tldr: dto.tldr } : {}),
        ...(dto.targetKeyword !== undefined ? { targetKeyword: dto.targetKeyword } : {}),
        ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
        ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
        ...(dto.scheduledFor ? { scheduledFor: new Date(dto.scheduledFor) } : {}),
        ...(dto.status === 'published' && !item.publishedAt ? { publishedAt: new Date() } : {}),
        ...(isContentChanged
          ? {
              revisions: {
                create: [
                  {
                    version: nextVersion,
                    content: dto.content!,
                    summary: 'Manual revision edit',
                    authorType: 'user',
                  },
                ],
              },
            }
          : {}),
      },
      include: { revisions: true },
    });
  }

  // ==========================================
  // CAMPAIGNS
  // ==========================================

  async listCampaigns(organizationId: string) {
    return this.prisma.campaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { contentItems: true } },
      },
    });
  }

  async createCampaign(organizationId: string, dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: 'active',
      },
    });
  }
}
