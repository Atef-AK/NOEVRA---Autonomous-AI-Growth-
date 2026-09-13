import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { getEnv } from '@growthos/config';
import { createModelRouter, ModelRouter } from '@growthos/ai';
import type {
  CreateLeadDto,
  UpdateLeadDto,
  ScanCommunityDto,
  DraftReplyDto,
} from './dto/leads.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  private readonly env = getEnv();
  private readonly modelRouter: ModelRouter;

  constructor(private readonly prisma: PrismaService) {
    this.modelRouter = createModelRouter({
      GOOGLE_AI_API_KEY: this.env.GOOGLE_AI_API_KEY,
      OPENAI_API_KEY: this.env.OPENAI_API_KEY,
      OPENAI_BASE_URL: this.env.OPENAI_BASE_URL,
      OPENROUTER_API_KEY: this.env.OPENROUTER_API_KEY,
      ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
      AI_DEFAULT_PROVIDER: this.env.AI_DEFAULT_PROVIDER,
    });
  }

  // ==========================================
  // LEADS PIPELINE
  // ==========================================

  async listLeads(
    organizationId: string,
    filters?: { stage?: string | undefined; minScore?: number | undefined },
  ) {
    const where: any = { organizationId };
    if (filters?.stage) {
      where.stage = filters.stage;
    }
    if (filters?.minScore !== undefined) {
      where.score = { gte: filters.minScore };
    }

    return this.prisma.lead.findMany({
      where,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getLead(organizationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with id '${id}' not found`);
    }

    return lead;
  }

  async createLead(organizationId: string, dto: CreateLeadDto) {
    let computedScore = dto.score ?? 50;

    // Heuristic scoring based on title if no explicit score was provided
    if (dto.score === undefined && dto.title) {
      const titleLower = dto.title.toLowerCase();
      if (
        titleLower.includes('founder') ||
        titleLower.includes('ceo') ||
        titleLower.includes('cto') ||
        titleLower.includes('cmo') ||
        titleLower.includes('vp') ||
        titleLower.includes('head of')
      ) {
        computedScore = 80;
      } else if (
        titleLower.includes('director') ||
        titleLower.includes('lead') ||
        titleLower.includes('principal')
      ) {
        computedScore = 70;
      }
    }

    return this.prisma.lead.create({
      data: {
        organizationId,
        name: dto.name,
        email: dto.email ?? null,
        company: dto.company,
        title: dto.title ?? null,
        stage: dto.stage ?? 'new',
        source: dto.source ?? 'community',
        score: computedScore,
        websiteUrl: dto.websiteUrl ?? null,
        linkedinUrl: dto.linkedinUrl ?? null,
        twitterUrl: dto.twitterUrl ?? null,
        notes: dto.notes ?? null,
        enrichmentData: {},
      },
    });
  }

  async updateLead(organizationId: string, id: string, dto: UpdateLeadDto) {
    await this.getLead(organizationId, id);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.company !== undefined ? { company: dto.company } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
        ...(dto.score !== undefined ? { score: dto.score } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  async enrichLead(organizationId: string, id: string) {
    const lead = await this.getLead(organizationId, id);

    // Deterministic enrichment based on company name
    const techStacks = ['Next.js', 'PostgreSQL', 'TailwindCSS', 'TypeScript', 'Stripe', 'OpenAI'];
    const headcount = 15 + ((lead.company.length * 7) % 180);
    const estimatedArr = `$${Math.max(1, Math.round(headcount * 120 / 1000))}M - $${Math.max(2, Math.round(headcount * 200 / 1000))}M`;

    // Calculate ICP match score
    let scoreBoost = 10;
    if (headcount >= 20 && headcount <= 150) scoreBoost += 15;
    if (lead.title?.toLowerCase().includes('founder') || lead.title?.toLowerCase().includes('head')) {
      scoreBoost += 20;
    }

    const newScore = Math.min(98, Math.max(40, lead.score + scoreBoost));
    const newStage = newScore >= 75 ? 'qualified' : 'enriching';

    const enrichmentData = {
      headcount,
      estimatedArr,
      technologies: techStacks.slice(0, 3 + (lead.company.length % 3)),
      intentSignals: ['Hiring Growth Engineers', 'Recently Raised Series A', 'Active on X & LinkedIn'],
      lastEnrichedAt: new Date().toISOString(),
    };

    return this.prisma.lead.update({
      where: { id },
      data: {
        score: newScore,
        stage: newStage,
        enrichmentData,
      },
    });
  }

  async deleteLead(organizationId: string, id: string) {
    await this.getLead(organizationId, id);
    await this.prisma.lead.delete({ where: { id } });
    return { success: true };
  }

  // ==========================================
  // COMMUNITY RADAR & CONVERSATIONS
  // ==========================================

  async listCommunityInteractions(
    organizationId: string,
    status?: string | undefined,
  ) {
    const where: any = { organizationId };
    if (status) {
      where.status = status;
    }

    return this.prisma.communityInteraction.findMany({
      where,
      orderBy: [{ intentScore: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async scanCommunity(organizationId: string, dto: ScanCommunityDto) {
    const brain = await this.prisma.companyBrain.findFirst({
      where: { organizationId },
    });

    const targetKeywords = dto.keywords && dto.keywords.length > 0
      ? dto.keywords
      : ['autonomous growth', 'seo automation', 'content repurposing', 'marketing agent'];

    const mockPosts = [
      {
        platform: 'twitter',
        postUrl: 'https://x.com/tech_builder/status/1892019481',
        author: '@tech_builder',
        title: null,
        content: `Anyone using AI agents for end-to-end SEO audits and programmatic content generation? Looking for tools that actually execute rather than just generate generic outlines.`,
        sentiment: 'positive',
        intentScore: 92,
      },
      {
        platform: 'reddit',
        postUrl: 'https://reddit.com/r/SaaS/comments/growth_stack_2026',
        author: 'u/saas_operator',
        title: 'What is your current stack for automated B2B distribution?',
        content: `We are scaling from $20k to $100k MRR and our content distribution is a major bottleneck. Looking for software that can turn longform blog posts into Twitter threads, LinkedIn carousels, and track SERP rankings automatically.`,
        sentiment: 'neutral',
        intentScore: 88,
      },
      {
        platform: 'hackernews',
        postUrl: 'https://news.ycombinator.com/item?id=43901294',
        author: 'foundervc',
        title: 'Ask HN: How are you thinking about autonomous marketing agents in 2026?',
        content: `Curious what early-stage startups are doing with agentic workflows for company memory, RICE prioritized backlog creation, and social distribution.`,
        sentiment: 'positive',
        intentScore: 85,
      },
    ];

    const results = [];
    for (const p of mockPosts) {
      const interaction = await this.prisma.communityInteraction.create({
        data: {
          organizationId,
          platform: p.platform,
          postUrl: p.postUrl,
          author: p.author,
          title: p.title,
          content: p.content,
          sentiment: p.sentiment,
          intentScore: p.intentScore,
          status: 'unreviewed',
        },
      });
      results.push(interaction);
    }

    return results;
  }

  async draftReply(organizationId: string, id: string, dto: DraftReplyDto) {
    const interaction = await this.prisma.communityInteraction.findFirst({
      where: { id, organizationId },
    });

    if (!interaction) {
      throw new NotFoundException(`Community interaction '${id}' not found`);
    }

    const brain = await this.prisma.companyBrain.findFirst({
      where: { organizationId },
    });

    const brandVoice = brain?.brandVoice ?? 'insightful, authoritative, technical, concise, non-spammy';
    const valueProps = Array.isArray(brain?.valueProps)
      ? (brain?.valueProps as string[]).join(', ')
      : 'autonomous AI growth department, automated SEO, multi-channel distribution';

    let generatedReply = '';
    if (this.env.OPENAI_API_KEY || this.env.ANTHROPIC_API_KEY || this.env.GOOGLE_AI_API_KEY) {
      try {
        const completion = await this.modelRouter.complete('google/gemini-2.5-flash', {
          messages: [
            {
              role: 'system',
              content: `You are an expert community growth engineer. Write an authentic, insightful, high-value response to this social conversation. 
Tone: ${brandVoice}.
Value props: ${valueProps}.
Rule: Never be overly promotional or sound like a bot. Add real actionable perspective first, then mention GrowthOS / NOEVRA naturally if relevant. Max 140 words.`,
            },
            {
              role: 'user',
              content: `Platform: ${interaction.platform}
Author: ${interaction.author}
Post Content: "${interaction.content}"
Directive: ${dto.intentDirective ?? 'Offer helpful technical perspective on multi-agent execution.'}`,
            },
          ],
        });
        generatedReply = completion.text?.trim() ?? '';
      } catch {
        generatedReply = '';
      }
    }

    if (!generatedReply) {
      generatedReply = `Great question! The biggest shift with modern AI growth systems is moving away from passive generation towards deterministic execution loops—where agents have access to real site crawlers, SERP APIs, and direct social connector webhooks rather than just outputting text prompts. We've been building GrowthOS around this exact premise.`;
    }

    return this.prisma.communityInteraction.update({
      where: { id },
      data: {
        replyDraft: generatedReply,
        status: 'approved',
      },
    });
  }

  async updateInteractionStatus(organizationId: string, id: string, status: string) {
    const interaction = await this.prisma.communityInteraction.findFirst({
      where: { id, organizationId },
    });

    if (!interaction) {
      throw new NotFoundException(`Community interaction '${id}' not found`);
    }

    return this.prisma.communityInteraction.update({
      where: { id },
      data: { status },
    });
  }
}
