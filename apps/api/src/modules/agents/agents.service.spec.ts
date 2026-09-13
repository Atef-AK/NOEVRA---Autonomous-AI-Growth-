import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import type { PrismaService } from '../../common/database/prisma.service';

function makeMockPrisma() {
  const members: any[] = [
    { id: 'm1', organizationId: 'org-1', userId: 'user-1', role: 'owner' },
  ];
  const agents: any[] = [
    {
      id: 'agent-1',
      organizationId: 'org-1',
      name: 'Test Agent',
      slug: 'test-agent',
      systemPrompt: 'You are a test agent',
      preferredModel: 'openai/gpt-4o',
      allowedTools: ['calculator'],
      maxSteps: 5,
      maxTokens: 1000,
      temperatureX10: 7,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'agent-inactive',
      organizationId: 'org-1',
      name: 'Inactive Agent',
      slug: 'inactive-agent',
      systemPrompt: 'You are inactive',
      preferredModel: 'openai/gpt-4o',
      allowedTools: [],
      maxSteps: 5,
      maxTokens: 1000,
      temperatureX10: 7,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  const runs: any[] = [];

  return {
    organizationMember: {
      findFirst: vi.fn(async ({ where }) => {
        return members.find(
          (m) => m.organizationId === where.organizationId && m.userId === where.userId,
        ) ?? null;
      }),
    },
    agent: {
      findMany: vi.fn(async ({ where }) => {
        return agents
          .filter((a) => a.organizationId === where.organizationId)
          .map((a) => ({ ...a, _count: { runs: 0 } }));
      }),
      findFirst: vi.fn(async ({ where }) => {
        return agents.find(
          (a) => a.id === where.id && a.organizationId === where.organizationId,
        ) ?? null;
      }),
      findUnique: vi.fn(async ({ where }) => {
        const { organizationId, slug } = where.organizationId_slug;
        return agents.find((a) => a.organizationId === organizationId && a.slug === slug) ?? null;
      }),
      create: vi.fn(async ({ data }) => {
        const newAgent = { id: `agent-${agents.length + 1}`, ...data };
        agents.push(newAgent);
        return newAgent;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = agents.findIndex((a) => a.id === where.id);
        if (idx >= 0) agents[idx] = { ...agents[idx], ...data };
        return agents[idx];
      }),
      delete: vi.fn(async ({ where }: any) => {
        const idx = agents.findIndex((a) => a.id === where.id);
        if (idx >= 0) agents.splice(idx, 1);
        return { id: where.id };
      }),
    },
    agentRun: {
      create: vi.fn(async ({ data }: any) => {
        const newRun = {
          id: `run-${runs.length + 1}`,
          ...data,
          createdAt: new Date(),
          startedAt: null,
          completedAt: null,
        };
        runs.push(newRun);
        return newRun;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return runs.filter(
          (r) => r.agentId === where.agentId && r.organizationId === where.organizationId,
        );
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return runs.find(
          (r) => r.id === where.id && r.organizationId === where.organizationId,
        ) ?? null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = runs.findIndex((r) => r.id === where.id);
        if (idx >= 0) runs[idx] = { ...runs[idx], ...data };
        return runs[idx];
      }),
    },
    project: {
      findFirst: vi.fn(async () => null),
    },
  } as unknown as PrismaService;
}

describe('AgentsService', () => {
  let service: AgentsService;
  let mockPrisma: PrismaService;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    service = new AgentsService(mockPrisma);
  });

  it('lists agents for an authorized organization member', async () => {
    const list = await service.list('org-1', 'user-1');
    expect(list).toHaveLength(2);
    expect(list[0]?.name).toBe('Test Agent');
  });

  it('throws ForbiddenException when user is not in organization', async () => {
    await expect(service.list('org-1', 'unauthorized-user')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('creates an agent with a slug generated from name', async () => {
    const agent = await service.create(
      'org-1',
      {
        name: 'Competitor Intelligence Agent',
        systemPrompt: 'You spy on competitors',
        preferredModel: 'openai/gpt-4o',
      },
      'user-1',
    );

    expect(agent.id).toBeDefined();
    expect(agent.slug).toBe('competitor-intelligence-agent');
    expect(agent.isActive).toBe(true);
  });

  it('triggers a run for an active agent', async () => {
    const run = await service.triggerRun(
      'agent-1',
      'org-1',
      { goal: 'Calculate 10 + 20' },
      'user-1',
    );

    expect(run.id).toBeDefined();
    expect(run.status).toBe('pending');
    expect(run.goal).toBe('Calculate 10 + 20');
  });

  it('rejects triggering a run on an inactive agent', async () => {
    await expect(
      service.triggerRun(
        'agent-inactive',
        'org-1',
        { goal: 'Do something' },
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when agent not found', async () => {
    await expect(
      service.findById('non-existent', 'org-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
