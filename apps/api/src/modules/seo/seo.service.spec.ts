import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeoService } from './seo.service';
import { PrismaService } from '../../common/database/prisma.service';

vi.mock('@growthos/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@growthos/shared')>();
  return {
    ...actual,
    safeUrl: vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('127.0.0.1') || url.includes('169.254') || url.includes('localhost')) {
        throw new Error('SSRF protection: Private or reserved IP');
      }
      return new URL(url);
    }),
  };
});

describe('SeoService', () => {
  let service: SeoService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      seoAudit: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      keywordTrack: {
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
    };

    service = new SeoService(mockPrisma as unknown as PrismaService);
  });

  it('runs an automated technical SEO audit and identifies semantic issues', async () => {
    mockPrisma.seoAudit.create.mockImplementation((args: any) => ({
      id: 'audit-1',
      ...args.data,
    }));

    const result = await service.runAudit('org-1', {
      targetUrl: 'https://growthos.ai/pricing',
    });

    expect(result.id).toBe('audit-1');
    expect(result.overallScore).toBeGreaterThanOrEqual(10);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.status).toBe('completed');
    expect(mockPrisma.seoAudit.create).toHaveBeenCalled();
  });

  it('rejects SSRF private / loopback IP target URLs', async () => {
    await expect(
      service.runAudit('org-1', { targetUrl: 'http://127.0.0.1:8080/admin' }),
    ).rejects.toThrow('SSRF');

    await expect(
      service.runAudit('org-1', { targetUrl: 'http://169.254.169.254/latest/meta-data' }),
    ).rejects.toThrow('SSRF');
  });

  it('tracks a target keyword and generates rank history', async () => {
    mockPrisma.keywordTrack.upsert.mockImplementation((args: any) => ({
      id: 'kw-1',
      ...args.create,
    }));

    const result = await service.trackKeyword('org-1', {
      keyword: 'autonomous AI agent marketing',
      targetRank: 1,
      intent: 'commercial',
    });

    expect(result.id).toBe('kw-1');
    expect(result.keyword).toBe('autonomous AI agent marketing');
    expect(result.difficulty).toBeGreaterThan(0);
    expect(result.searchVolume).toBeGreaterThan(0);
    expect((result.rankHistory as any)?.length).toBe(3);
    expect(mockPrisma.keywordTrack.upsert).toHaveBeenCalled();
  });

  it('lists audits and keywords', async () => {
    mockPrisma.seoAudit.findMany.mockResolvedValue([{ id: 'a-1', overallScore: 92 }]);
    mockPrisma.keywordTrack.findMany.mockResolvedValue([{ id: 'k-1', keyword: 'pgvector' }]);

    const audits = await service.listAudits('org-1');
    const keywords = await service.listKeywords('org-1');

    expect(audits.length).toBe(1);
    expect(keywords.length).toBe(1);
  });
});
