import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { getEnv } from '@growthos/config';
import { createModelRouter, ModelRouter } from '@growthos/ai';
import {
  calculateRiceScore,
  calculateIceScore,
  getExecutableTasks,
} from '@growthos/shared';
import { AgentsService } from '../agents/agents.service';
import type {
  CreateGoalDto,
  DecomposeGoalDto,
  CreateMissionDto,
  UpdateMissionDto,
  CreateTaskDto,
  CreateOpportunityDto,
} from './dto/strategy.dto';

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);
  private readonly env = getEnv();
  private readonly modelRouter: ModelRouter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
  ) {
    this.modelRouter = createModelRouter({
      OPENAI_API_KEY: this.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
      GOOGLE_AI_API_KEY: this.env.GOOGLE_AI_API_KEY,
    });
  }

  // ==========================================
  // GOALS
  // ==========================================

  async createGoal(organizationId: string, dto: CreateGoalDto) {
    return this.prisma.growthGoal.create({
      data: {
        organizationId,
        title: dto.title,
        description: dto.description ?? null,
        metricName: dto.metricName,
        targetValue: dto.targetValue,
        currentValue: dto.currentValue ?? 0,
        unit: dto.unit ?? 'count',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        priority: dto.priority ?? 1,
        strategyNotes: dto.strategyNotes ?? null,
        status: 'active',
      },
    });
  }

  async listGoals(organizationId: string) {
    const goals = await this.prisma.growthGoal.findMany({
      where: { organizationId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      include: {
        missions: {
          include: {
            tasks: {
              select: { id: true, status: true },
            },
          },
        },
        opportunities: {
          select: { id: true, riceScore: true, status: true },
        },
      },
    });

    return goals.map((g) => {
      const progressPercentage =
        g.targetValue > 0
          ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
          : 0;
      const totalTasks = g.missions.reduce((acc, m) => acc + m.tasks.length, 0);
      const completedTasks = g.missions.reduce(
        (acc, m) => acc + m.tasks.filter((t) => t.status === 'completed').length,
        0,
      );

      return {
        ...g,
        progressPercentage,
        totalTasks,
        completedTasks,
      };
    });
  }

  async getGoal(organizationId: string, goalId: string) {
    const goal = await this.prisma.growthGoal.findFirst({
      where: { id: goalId, organizationId },
      include: {
        missions: {
          include: {
            tasks: {
              orderBy: { createdAt: 'asc' },
              include: {
                agent: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
        opportunities: {
          orderBy: { riceScore: 'desc' },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Growth goal not found');
    }

    return goal;
  }

  // ==========================================
  // GOAL DECOMPOSITION ENGINE
  // ==========================================

  async decomposeGoal(
    organizationId: string,
    goalId: string,
    dto: DecomposeGoalDto,
  ) {
    const goal = await this.getGoal(organizationId, goalId);

    // Fetch primary company brain context for brand alignment
    const brain = await this.prisma.companyBrain.findFirst({
      where: { organizationId },
    });

    // Structure missions & tasks to generate
    const prompt = `Decompose the following high-level growth goal into 3 strategic missions and 6-9 tactical tasks for autonomous AI agents:
Goal: ${goal.title}
Target Metric: ${goal.metricName} (Current: ${goal.currentValue}, Target: ${goal.targetValue})
Description: ${goal.description ?? 'None'}
Brand Context: ${brain?.brandVoice ?? 'Direct, data-driven, engineering-led B2B SaaS'}
Target Audience: ${brain?.targetAudience ?? 'Developers, CTOs, growth teams'}
Custom Instructions: ${dto.prompt ?? 'Generate actionable missions across Content, SEO, and Outbound distribution.'}

Format response strictly as JSON with this schema:
{
  "missions": [
    {
      "title": "Mission title",
      "objective": "Clear strategic objective",
      "estimatedImpact": "Expected metric delta",
      "ownerAgentRole": "content_specialist | seo_specialist | growth_director | social_specialist",
      "tasks": [
        {
          "title": "Actionable task title",
          "description": "Specific instruction for the AI agent",
          "priority": "high | medium | low",
          "dependencies": []
        }
      ]
    }
  ]
}`;

    let decompositionData: {
      missions: Array<{
        title: string;
        objective: string;
        estimatedImpact: string;
        ownerAgentRole: string;
        tasks: Array<{
          title: string;
          description: string;
          priority: 'low' | 'medium' | 'high' | 'critical';
          dependencies?: string[];
        }>;
      }>;
    };

    try {
      if (
        this.env.OPENAI_API_KEY ||
        this.env.ANTHROPIC_API_KEY ||
        this.env.GOOGLE_AI_API_KEY
      ) {
        const response = await this.modelRouter.complete('openai/gpt-4o', {
          messages: [
            {
              role: 'system',
              content:
                'You are an expert Head of Growth and autonomous agent director. Always output valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
        });

        decompositionData = JSON.parse(response.text ?? '{}');
      } else {
        decompositionData = this.getHeuristicDecomposition(goal);
      }
    } catch (error) {
      this.logger.warn(
        `AI decomposition failed or provider not configured, falling back to heuristic engine: ${
          (error as Error).message
        }`,
      );
      decompositionData = this.getHeuristicDecomposition(goal);
    }

    // Persist missions & tasks in database
    const createdMissions = [];

    for (const m of decompositionData.missions) {
      const mission = await this.prisma.growthMission.create({
        data: {
          organizationId,
          goalId: goal.id,
          title: m.title,
          objective: m.objective,
          estimatedImpact: m.estimatedImpact,
          ownerAgentRole: m.ownerAgentRole ?? 'growth_director',
          status: 'planned',
          progress: 0,
        },
      });

      const taskMap = new Map<string, string>(); // index -> created taskId

      for (let i = 0; i < m.tasks.length; i++) {
        const t = m.tasks[i]!;
        // Resolve simple integer index dependencies if provided
        const resolvedDeps: string[] = [];

        const task = await this.prisma.growthTask.create({
          data: {
            organizationId,
            missionId: mission.id,
            title: t.title,
            description: t.description,
            priority: t.priority ?? 'medium',
            status: 'pending',
            dependencies: resolvedDeps,
          },
        });

        taskMap.set(String(i), task.id);
      }

      createdMissions.push(mission);
    }

    return this.getGoal(organizationId, goalId);
  }

  private getHeuristicDecomposition(goal: {
    title: string;
    metricName: string;
    targetValue: number;
  }) {
    return {
      missions: [
        {
          title: `Technical SEO & Authority Surge for ${goal.title}`,
          objective: `Systematically dominate high-intent keywords to achieve ${goal.targetValue} ${goal.metricName}.`,
          estimatedImpact: '+35% Organic Velocity',
          ownerAgentRole: 'seo_specialist',
          tasks: [
            {
              title: 'Perform competitor SERP gap analysis',
              description:
                'Scan top 10 competitors for high-volume keywords with low difficulty.',
              priority: 'high' as const,
              dependencies: [],
            },
            {
              title: 'Generate pillar architecture & programmatic cluster map',
              description:
                'Produce 5 high-converting topic cluster briefs targeting primary conversion keywords.',
              priority: 'high' as const,
              dependencies: [],
            },
          ],
        },
        {
          title: `High-Conversion Content Engine Sprint`,
          objective: `Draft, optimize, and publish targeted product-led content addressing customer objections.`,
          estimatedImpact: '+25% Signup Rate',
          ownerAgentRole: 'content_specialist',
          tasks: [
            {
              title: 'Draft comparison and migration guides',
              description:
                'Generate objective comparison pages highlighting architectural advantages.',
              priority: 'medium' as const,
              dependencies: [],
            },
            {
              title: 'Create viral developer distribution assets',
              description:
                'Extract snippets, benchmarks, and architectural blueprints for technical social channels.',
              priority: 'medium' as const,
              dependencies: [],
            },
          ],
        },
        {
          title: `Outbound Growth & Developer Community Amplification`,
          objective: `Distribute growth content across relevant developer hubs and engage high-fit leads.`,
          estimatedImpact: '+18% Qualified Leads',
          ownerAgentRole: 'growth_director',
          tasks: [
            {
              title: 'Identify target community engagement threads',
              description:
                'Discover active GitHub issues, Reddit discussions, and Twitter queries relevant to the solution.',
              priority: 'medium' as const,
              dependencies: [],
            },
            {
              title: 'Execute automated outreach and relationship nurturing',
              description:
                'Send personalized, value-first invitations and technical teardowns to prospective leads.',
              priority: 'low' as const,
              dependencies: [],
            },
          ],
        },
      ],
    };
  }

  // ==========================================
  // MISSIONS
  // ==========================================

  async listMissions(organizationId: string, goalId?: string) {
    return this.prisma.growthMission.findMany({
      where: {
        organizationId,
        ...(goalId ? { goalId } : {}),
      },
      include: {
        goal: { select: { id: true, title: true, metricName: true } },
        tasks: {
          orderBy: { createdAt: 'asc' },
          include: {
            agent: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMission(organizationId: string, dto: CreateMissionDto) {
    return this.prisma.growthMission.create({
      data: {
        organizationId,
        goalId: dto.goalId ?? null,
        title: dto.title,
        objective: dto.objective,
        estimatedImpact: dto.estimatedImpact ?? null,
        ownerAgentRole: dto.ownerAgentRole ?? 'growth_director',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        status: 'planned',
        progress: 0,
      },
    });
  }

  async updateMission(
    organizationId: string,
    missionId: string,
    dto: UpdateMissionDto,
  ) {
    const mission = await this.prisma.growthMission.findFirst({
      where: { id: missionId, organizationId },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    return this.prisma.growthMission.update({
      where: { id: missionId },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.progress !== undefined ? { progress: dto.progress } : {}),
        ...(dto.estimatedImpact ? { estimatedImpact: dto.estimatedImpact } : {}),
      },
    });
  }

  // ==========================================
  // TASKS
  // ==========================================

  async listTasks(organizationId: string, missionId?: string) {
    const tasks = await this.prisma.growthTask.findMany({
      where: {
        organizationId,
        ...(missionId ? { missionId } : {}),
      },
      include: {
        mission: { select: { id: true, title: true, status: true } },
        agent: { select: { id: true, name: true, slug: true } },
        agentRun: { select: { id: true, status: true, totalCostUsd: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Check executable status using graph resolution
    const executableNodes = getExecutableTasks(
      tasks.map((t) => ({
        id: t.id,
        status: t.status,
        dependencies: (t.dependencies as string[]) ?? [],
      })),
    );
    const executableSet = new Set(executableNodes.map((n) => n.id));

    return tasks.map((t) => ({
      ...t,
      isExecutable: executableSet.has(t.id),
    }));
  }

  async createTask(organizationId: string, dto: CreateTaskDto) {
    const mission = await this.prisma.growthMission.findFirst({
      where: { id: dto.missionId, organizationId },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    return this.prisma.growthTask.create({
      data: {
        organizationId,
        missionId: dto.missionId,
        agentId: dto.agentId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        priority: dto.priority ?? 'medium',
        dependencies: dto.dependencies ?? [],
        status: 'pending',
      },
    });
  }

  async executeTask(
    organizationId: string,
    taskId: string,
    requestingUserId: string,
  ) {
    const task = await this.prisma.growthTask.findFirst({
      where: { id: taskId, organizationId },
      include: { mission: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check dependencies
    const deps = (task.dependencies as string[]) ?? [];
    if (deps.length > 0) {
      const pendingDeps = await this.prisma.growthTask.findMany({
        where: {
          id: { in: deps },
          status: { not: 'completed' },
        },
      });

      if (pendingDeps.length > 0) {
        throw new BadRequestException(
          `Cannot execute task: ${pendingDeps.length} dependency tasks must be completed first.`,
        );
      }
    }

    // Find agent for execution: specified agent, or first active agent in org
    let agentId = task.agentId;
    if (!agentId) {
      const activeAgent = await this.prisma.agent.findFirst({
        where: { organizationId, isActive: true },
      });
      if (activeAgent) {
        agentId = activeAgent.id;
      }
    }

    let runId: string | null = null;
    if (agentId) {
      try {
        const run = await this.agentsService.triggerRun(
          agentId,
          organizationId,
          {
            goal: `Execute Growth Task: ${task.title}\nContext/Mission: ${task.mission.title}\nInstructions: ${task.description ?? 'Execute to standard.'}`,
          },
          requestingUserId,
        );
        runId = run.id;
      } catch (err) {
        this.logger.warn(`Could not trigger agent run: ${(err as Error).message}`);
      }
    }

    const updatedTask = await this.prisma.growthTask.update({
      where: { id: taskId },
      data: {
        status: 'running',
        agentId: agentId ?? null,
        agentRunId: runId,
      },
      include: {
        agent: true,
        agentRun: true,
      },
    });

    return updatedTask;
  }

  // ==========================================
  // OPPORTUNITIES & RICE / ICE SCORING
  // ==========================================

  async listOpportunities(organizationId: string) {
    return this.prisma.growthOpportunity.findMany({
      where: { organizationId },
      orderBy: { riceScore: 'desc' },
      include: {
        goal: { select: { id: true, title: true } },
      },
    });
  }

  async createOpportunity(organizationId: string, dto: CreateOpportunityDto) {
    const riceScore = calculateRiceScore(
      dto.reach,
      dto.impact,
      dto.confidence,
      dto.effort,
    );
    const iceScore = calculateIceScore(dto.impact, dto.confidence, dto.effort, true);

    return this.prisma.growthOpportunity.create({
      data: {
        organizationId,
        goalId: dto.goalId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category ?? 'content',
        reach: dto.reach,
        impact: dto.impact,
        confidence: dto.confidence,
        effort: dto.effort,
        riceScore,
        iceScore,
        status: 'discovered',
      },
    });
  }

  async convertOpportunityToMission(
    organizationId: string,
    opportunityId: string,
  ) {
    const opp = await this.prisma.growthOpportunity.findFirst({
      where: { id: opportunityId, organizationId },
    });

    if (!opp) {
      throw new NotFoundException('Growth opportunity not found');
    }

    // Update opportunity status
    await this.prisma.growthOpportunity.update({
      where: { id: opportunityId },
      data: { status: 'in_mission' },
    });

    // Create mission from opportunity
    const mission = await this.prisma.growthMission.create({
      data: {
        organizationId,
        goalId: opp.goalId ?? null,
        title: `Execute: ${opp.title}`,
        objective: opp.description ?? `Capitalize on opportunity: ${opp.title}`,
        estimatedImpact: `RICE Score: ${opp.riceScore}`,
        status: 'planned',
        progress: 0,
        tasks: {
          create: [
            {
              organizationId,
              title: `Research & strategy planning for ${opp.title}`,
              description: `Prepare execution roadmap and identify required resources.`,
              priority: 'high',
              status: 'pending',
              dependencies: [],
            },
          ],
        },
      },
      include: { tasks: true },
    });

    return mission;
  }
}
