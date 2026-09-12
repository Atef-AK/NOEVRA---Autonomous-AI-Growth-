import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentService } from './content.service';
import { PrismaService } from '../../common/database/prisma.service';

describe('ContentService', () => {
  let service: ContentService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      contentItem: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      campaign: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      companyBrain: {
        findFirst: vi.fn().mockResolvedValue({
          brandVoice: 'Authoritative, technical, developer-first',
          targetAudience: 'CTOs and senior software engineers',
        }),
      },
      agent: {
        findFirst: vi.fn().mockResolvedValue({ id: 'agent-content-1', name: 'Content Specialist' }),
      },
    };

    service = new ContentService(mockPrisma as unknown as PrismaService);
  });

  it('generates a blog post grounded in company brain voice', async () => {
    mockPrisma.contentItem.create.mockImplementation((args: any) => ({
      id: 'content-1',
      ...args.data,
      revisions: [{ id: 'rev-1', version: 1 }],
    }));

    const result = await service.generateContent('org-1', {
      topic: 'Vector Search in PostgreSQL with pgvector',
      type: 'blog_post',
      targetKeyword: 'pgvector tutorial',
    });

    expect(result.id).toBe('content-1');
    expect(result.type).toBe('blog_post');
    expect(result.brandVoiceScore).toBeGreaterThan(80);
    expect(result.content).toContain('pgvector');
    expect(mockPrisma.companyBrain.findFirst).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
    });
    expect(mockPrisma.contentItem.create).toHaveBeenCalled();
  });

  it('repurposes long-form content into a multi-tweet thread', async () => {
    mockPrisma.contentItem.findFirst.mockResolvedValue({
      id: 'content-blog',
      title: 'Architecting Autonomous Agents with ReAct',
      type: 'blog_post',
      targetKeyword: 'autonomous agents',
      campaignId: 'camp-1',
      missionId: 'm-1',
      authorAgentId: 'agent-1',
      content: 'Long article content...',
    });

    mockPrisma.contentItem.create.mockImplementation((args: any) => ({
      id: 'content-thread',
      ...args.data,
    }));

    const result = await service.repurposeContent('org-1', 'content-blog', {
      targetType: 'tweet_thread',
    });

    expect(result.id).toBe('content-thread');
    expect(result.type).toBe('tweet_thread');
    expect(result.content).toContain('1/7');
    expect(mockPrisma.contentItem.create).toHaveBeenCalled();
  });

  it('creates a new revision when updating content body', async () => {
    mockPrisma.contentItem.findFirst.mockResolvedValue({
      id: 'content-1',
      organizationId: 'org-1',
      title: 'Original Title',
      content: 'Original Content Body',
      revisions: [{ id: 'rev-1', version: 1 }],
    });

    mockPrisma.contentItem.update.mockImplementation((args: any) => ({
      id: 'content-1',
      ...args.data,
      revisions: [{ id: 'rev-1', version: 1 }, { id: 'rev-2', version: 2 }],
    }));

    const updated = await service.updateContent('org-1', 'content-1', {
      content: 'Updated Content with New Technical Benchmarks',
    });

    expect(mockPrisma.contentItem.update).toHaveBeenCalled();
    const updateCall = mockPrisma.contentItem.update.mock.calls[0][0];
    expect(updateCall.data.revisions.create).toBeDefined();
    expect(updateCall.data.revisions.create[0].version).toBe(2);
  });

  it('creates and lists marketing campaigns', async () => {
    const camp = { id: 'camp-1', name: 'Q4 Developer Push', status: 'active' };
    mockPrisma.campaign.create.mockResolvedValue(camp);
    mockPrisma.campaign.findMany.mockResolvedValue([camp]);

    const created = await service.createCampaign('org-1', {
      name: 'Q4 Developer Push',
      description: 'Acquire 5,000 developers',
    });
    expect(created.id).toBe('camp-1');

    const list = await service.listCampaigns('org-1');
    expect(list.length).toBe(1);
    expect(list[0]?.name).toBe('Q4 Developer Push');
  });
});
