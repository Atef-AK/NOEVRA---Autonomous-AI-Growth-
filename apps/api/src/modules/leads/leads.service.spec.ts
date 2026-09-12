import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      lead: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      communityInteraction: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      companyBrain: {
        findFirst: vi.fn().mockResolvedValue({
          brandVoice: 'insightful, technical, authoritative',
          valueProps: ['autonomous AI growth department', 'programmatic SEO'],
        }),
      },
    };

    service = new LeadsService(mockPrisma);
  });

  it('creates a prospect lead with seniority-based heuristic score', async () => {
    const mockCreated = {
      id: 'lead-1',
      organizationId: 'org-1',
      name: 'Sarah Chen',
      email: 'sarah@hypergrowth.io',
      company: 'HyperGrowth AI',
      title: 'Head of Growth',
      stage: 'new',
      score: 80,
    };

    mockPrisma.lead.create.mockResolvedValue(mockCreated);

    const result = await service.createLead('org-1', {
      name: 'Sarah Chen',
      email: 'sarah@hypergrowth.io',
      company: 'HyperGrowth AI',
      title: 'Head of Growth',
    });

    expect(result.id).toBe('lead-1');
    expect(mockPrisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          name: 'Sarah Chen',
          score: 80,
        }),
      }),
    );
  });

  it('enriches a lead with technographics and updates ICP stage', async () => {
    const existingLead = {
      id: 'lead-1',
      organizationId: 'org-1',
      name: 'Sarah Chen',
      company: 'HyperGrowth AI',
      title: 'Head of Growth',
      score: 70,
      stage: 'new',
    };

    mockPrisma.lead.findFirst.mockResolvedValue(existingLead);
    mockPrisma.lead.update.mockImplementation(({ data }: any) => ({
      ...existingLead,
      ...data,
    }));

    const result = await service.enrichLead('org-1', 'lead-1');

    expect(result.score).toBeGreaterThan(70);
    expect(result.stage).toBe('qualified');
    expect(result.enrichmentData).toBeDefined();
  });

  it('scans community sources and discovers high-intent conversations', async () => {
    mockPrisma.communityInteraction.create.mockImplementation(({ data }: any) => ({
      id: `comm-${Math.random()}`,
      ...data,
    }));

    const results = await service.scanCommunity('org-1', {
      keywords: ['autonomous growth', 'seo automation'],
    });

    expect(results.length).toBeGreaterThanOrEqual(3);
    expect(results[0]?.intentScore).toBeGreaterThanOrEqual(80);
    expect(mockPrisma.communityInteraction.create).toHaveBeenCalled();
  });

  it('drafts an AI reply tailored to brand voice and problem statement', async () => {
    const mockInteraction = {
      id: 'comm-1',
      organizationId: 'org-1',
      platform: 'twitter',
      author: '@tech_builder',
      content: 'Looking for autonomous AI growth agents to handle SEO and distribution.',
      status: 'unreviewed',
    };

    mockPrisma.communityInteraction.findFirst.mockResolvedValue(mockInteraction);
    mockPrisma.communityInteraction.update.mockResolvedValue({
      ...mockInteraction,
      replyDraft: 'Generated brand-aligned response',
      status: 'approved',
    });

    const result = await service.draftReply('org-1', 'comm-1', {
      intentDirective: 'Highlight execution loops',
    });

    expect(result.replyDraft).toBeDefined();
    expect(result.status).toBe('approved');
  });
});
