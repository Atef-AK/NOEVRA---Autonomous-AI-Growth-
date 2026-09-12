import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import slugify from 'slugify';
import { PrismaService } from '../../common/database/prisma.service';
import { getEnv } from '@growthos/config';
import { createModelRouter, ModelRouter } from '@growthos/ai';
import { createDefaultRegistry, ToolRegistry } from '@growthos/tools';
import { AgentExecutor } from '@growthos/agent-runtime';
import type { CreateAgentDto, UpdateAgentDto, TriggerAgentRunDto } from './dto/agent.dto';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private readonly env = getEnv();
  private readonly modelRouter: ModelRouter;
  private readonly toolRegistry: ToolRegistry;

  constructor(private readonly prisma: PrismaService) {
    this.modelRouter = createModelRouter({
      OPENAI_API_KEY: this.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
      GOOGLE_AI_API_KEY: this.env.GOOGLE_AI_API_KEY,
    });
    this.toolRegistry = createDefaultRegistry({
      serpApiKey: this.env.SERPAPI_API_KEY,
      braveApiKey: this.env.BRAVE_SEARCH_API_KEY,
      linkedinAccessToken: this.env.LINKEDIN_ACCESS_TOKEN,
      twitterBearerToken: this.env.TWITTER_BEARER_TOKEN,
      twitterAccessToken: this.env.TWITTER_ACCESS_TOKEN,
      twitterAccessSecret: this.env.TWITTER_ACCESS_SECRET,
      twitterClientId: this.env.TWITTER_CLIENT_ID,
      twitterClientSecret: this.env.TWITTER_CLIENT_SECRET,
      metaPageAccessToken: this.env.META_PAGE_ACCESS_TOKEN,
      metaInstagramAccountId: this.env.META_INSTAGRAM_ACCOUNT_ID,
      tiktokAccessToken: this.env.TIKTOK_ACCESS_TOKEN,
      redditClientId: this.env.REDDIT_CLIENT_ID,
      redditClientSecret: this.env.REDDIT_CLIENT_SECRET,
      redditUsername: this.env.REDDIT_USERNAME,
      redditPassword: this.env.REDDIT_PASSWORD,
      redditUserAgent: this.env.REDDIT_USER_AGENT,
    });
  }

  async list(organizationId: string, requestingUserId: string) {
    await this.verifyOrgMembership(organizationId, requestingUserId);

    return this.prisma.agent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        preferredModel: true,
        allowedTools: true,
        isActive: true,
        maxSteps: true,
        maxTokens: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { runs: true },
        },
      },
    });
  }

  async findById(agentId: string, organizationId: string, requestingUserId: string) {
    await this.verifyOrgMembership(organizationId, requestingUserId);

    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async create(organizationId: string, dto: CreateAgentDto, requestingUserId: string) {
    await this.verifyOrgMembership(organizationId, requestingUserId);

    const baseSlug = slugify(dto.name, { lower: true, strict: true }) || 'agent';
    let slug = baseSlug;
    let counter = 1;
    while (
      await this.prisma.agent.findUnique({
        where: { organizationId_slug: { organizationId, slug } },
      })
    ) {
      slug = `${baseSlug}-${counter++}`;
    }

    return this.prisma.agent.create({
      data: {
        organizationId,
        name: dto.name,
        slug,
        description: dto.description ?? null,
        systemPrompt: dto.systemPrompt,
        preferredModel: dto.preferredModel ?? 'openai/gpt-4o',
        allowedTools: dto.allowedTools ?? ['web_search', 'fetch_url', 'calculator'],
        maxSteps: dto.maxSteps ?? 10,
        maxTokens: dto.maxTokens ?? 4096,
        temperatureX10: dto.temperatureX10 ?? 7,
        isActive: true,
      },
    });
  }

  async update(
    agentId: string,
    organizationId: string,
    dto: UpdateAgentDto,
    requestingUserId: string,
  ) {
    await this.findById(agentId, organizationId, requestingUserId);

    return this.prisma.agent.update({
      where: { id: agentId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.systemPrompt !== undefined ? { systemPrompt: dto.systemPrompt } : {}),
        ...(dto.preferredModel !== undefined ? { preferredModel: dto.preferredModel } : {}),
        ...(dto.allowedTools !== undefined ? { allowedTools: dto.allowedTools } : {}),
        ...(dto.maxSteps !== undefined ? { maxSteps: dto.maxSteps } : {}),
        ...(dto.maxTokens !== undefined ? { maxTokens: dto.maxTokens } : {}),
        ...(dto.temperatureX10 !== undefined ? { temperatureX10: dto.temperatureX10 } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async delete(agentId: string, organizationId: string, requestingUserId: string) {
    await this.findById(agentId, organizationId, requestingUserId);

    await this.prisma.agent.delete({
      where: { id: agentId },
    });

    return { deleted: true };
  }

  async triggerRun(
    agentId: string,
    organizationId: string,
    dto: TriggerAgentRunDto,
    requestingUserId: string,
  ) {
    const agent = await this.findById(agentId, organizationId, requestingUserId);

    if (!agent.isActive) {
      throw new BadRequestException('Cannot trigger runs on an inactive agent');
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, organizationId },
      });
      if (!project) {
        throw new NotFoundException('Project not found in this organization');
      }
    }

    // Create AgentRun in pending status
    const run = await this.prisma.agentRun.create({
      data: {
        organizationId,
        projectId: dto.projectId ?? null,
        agentId,
        triggeredById: requestingUserId,
        status: 'pending',
        goal: dto.goal,
      },
    });

    // Execute asynchronously (background processing)
    const executor = new AgentExecutor({
      db: this.prisma,
      modelRouter: this.modelRouter,
      toolRegistry: this.toolRegistry,
    });

    // Fire and handle errors gracefully
    void executor
      .execute({
        agentRunId: run.id,
        organizationId,
        projectId: dto.projectId,
        agent: {
          systemPrompt: agent.systemPrompt,
          allowedTools: (agent.allowedTools as string[]) ?? [],
          preferredModel: agent.preferredModel,
          maxSteps: agent.maxSteps,
          maxTokens: agent.maxTokens,
          temperatureX10: agent.temperatureX10,
        },
        goal: dto.goal,
      })
      .then((res) => {
        this.logger.log(`Agent run ${run.id} completed successfully in ${res.durationMs}ms`);
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Agent run ${run.id} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      });

    return run;
  }

  async listRuns(agentId: string, organizationId: string, requestingUserId: string) {
    await this.findById(agentId, organizationId, requestingUserId);

    return this.prisma.agentRun.findMany({
      where: { agentId, organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        goal: true,
        result: true,
        _count: {
          select: { steps: true },
        },
        totalInputTokens: true,
        totalOutputTokens: true,
        totalCostUsd: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });
  }

  async getRunDetails(runId: string, organizationId: string, requestingUserId: string) {
    await this.verifyOrgMembership(organizationId, requestingUserId);

    const run = await this.prisma.agentRun.findFirst({
      where: { id: runId, organizationId },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            slug: true,
            preferredModel: true,
          },
        },
        steps: {
          orderBy: { stepIndex: 'asc' },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Agent run not found');
    }

    return run;
  }

  private async verifyOrgMembership(organizationId: string, userId: string): Promise<void> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId },
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }
  }
}
