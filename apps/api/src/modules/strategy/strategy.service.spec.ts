import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrategyService } from './strategy.service';
import { PrismaService } from '../../common/database/prisma.service';
import { AgentsService } from '../agents/agents.service';

describe('StrategyService', () => {
  let service: StrategyService;
  let mockPrisma: any;
  let mockAgentsService: any;

  beforeEach(() => {
    mockPrisma = {
      growthGoal: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      growthMission: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      growthTask: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      growthOpportunity: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      companyBrain: {
        findFirst: vi.fn().mockResolvedValue({
          brandVoice: 'Technical, developer-first, clear',
          targetAudience: 'Software engineers',
        }),
      },
      agent: {
        findFirst: vi.fn().mockResolvedValue({ id: 'agent-1', name: 'Growth Director' }),
      },
    };

    mockAgentsService = {
      triggerRun: vi.fn().mockResolvedValue({ id: 'run-1', status: 'queued' }),
    };

    service = new StrategyService(
      mockPrisma as unknown as PrismaService,
      mockAgentsService as unknown as AgentsService,
    );
  });

  it('creates a strategic growth goal with default active status', async () => {
    const goalData = {
      id: 'goal-1',
      organizationId: 'org-1',
      title: 'Reach $100k MRR',
      metricName: 'MRR',
      targetValue: 100000,
      currentValue: 15000,
      unit: 'usd',
      status: 'active',
      priority: 1,
    };
    mockPrisma.growthGoal.create.mockResolvedValue(goalData);

    const result = await service.createGoal('org-1', {
      title: 'Reach $100k MRR',
      metricName: 'MRR',
      targetValue: 100000,
      currentValue: 15000,
      unit: 'usd',
      priority: 1,
    });

    expect(result).toEqual(goalData);
    expect(mockPrisma.growthGoal.create).toHaveBeenCalled();
  });

  it('lists goals with calculated progress percentage and task counts', async () => {
    mockPrisma.growthGoal.findMany.mockResolvedValue([
      {
        id: 'goal-1',
        title: 'Reach $100k MRR',
        metricName: 'MRR',
        targetValue: 100000,
        currentValue: 25000,
        missions: [
          {
            id: 'm-1',
            tasks: [
              { id: 't-1', status: 'completed' },
              { id: 't-2', status: 'pending' },
            ],
          },
        ],
        opportunities: [],
      },
    ]);

    const result = await service.listGoals('org-1');
    expect(result[0]?.progressPercentage).toBe(25);
    expect(result[0]?.totalTasks).toBe(2);
    expect(result[0]?.completedTasks).toBe(1);
  });

  it('creates growth opportunity with calculated RICE and ICE scores', async () => {
    mockPrisma.growthOpportunity.create.mockImplementation((args: any) => ({
      id: 'opp-1',
      ...args.data,
    }));

    const result = await service.createOpportunity('org-1', {
      title: 'Interactive CLI tool showcase',
      reach: 8,
      impact: 7,
      confidence: 9,
      effort: 3,
    });

    // RICE = (8 * 7 * 9) / 3 = 504 / 3 = 168
    expect(result.riceScore).toBe(168);
    // ICE = 7 * 9 * (11 - 3) = 63 * 8 = 504
    expect(result.iceScore).toBe(504);
    expect(mockPrisma.growthOpportunity.create).toHaveBeenCalled();
  });

  it('decomposes a goal into missions and tasks', async () => {
    const goal = {
      id: 'goal-1',
      title: 'Scale to 5,000 developer signups',
      metricName: 'Signups',
      currentValue: 500,
      targetValue: 5000,
      missions: [],
      opportunities: [],
    };
    mockPrisma.growthGoal.findFirst.mockResolvedValue(goal);

    let missionCounter = 0;
    mockPrisma.growthMission.create.mockImplementation((args: any) => {
      missionCounter++;
      return { id: `m-${missionCounter}`, ...args.data };
    });

    mockPrisma.growthTask.create.mockImplementation((args: any) => ({
      id: `t-${Math.random()}`,
      ...args.data,
    }));

    await service.decomposeGoal('org-1', 'goal-1', {});

    expect(mockPrisma.growthMission.create).toHaveBeenCalled();
    expect(mockPrisma.growthTask.create).toHaveBeenCalled();
  });

  it('converts an opportunity into an active mission with starter task', async () => {
    mockPrisma.growthOpportunity.findFirst.mockResolvedValue({
      id: 'opp-1',
      organizationId: 'org-1',
      title: 'Launch on Product Hunt',
      description: 'Prepare launch assets and schedule hunter outreach',
      riceScore: 140,
    });
    mockPrisma.growthOpportunity.update.mockResolvedValue({});
    mockPrisma.growthMission.create.mockResolvedValue({
      id: 'm-ph',
      title: 'Execute: Launch on Product Hunt',
      status: 'planned',
      tasks: [{ id: 't-init' }],
    });

    const mission = await service.convertOpportunityToMission('org-1', 'opp-1');
    expect(mockPrisma.growthOpportunity.update).toHaveBeenCalledWith({
      where: { id: 'opp-1' },
      data: { status: 'in_mission' },
    });
    expect(mission.id).toBe('m-ph');
  });
});
