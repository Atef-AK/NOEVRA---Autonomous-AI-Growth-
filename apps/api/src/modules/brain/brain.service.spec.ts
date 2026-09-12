import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { BrainService } from './brain.service';
import type { PrismaService } from '../../common/database/prisma.service';

function makeMockPrisma() {
  const members: any[] = [
    { id: 'm1', organizationId: 'org-1', userId: 'user-1', role: 'owner' },
  ];
  let brain: any = {
    id: 'brain-1',
    organizationId: 'org-1',
    name: 'Primary Brain',
    summary: 'Initial summary',
    brandVoice: 'Authoritative',
    targetAudience: 'B2B Founders',
    valueProps: ['Fast', 'Autonomous'],
    competitors: ['CompA'],
    positioning: 'Leading engine',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sources: any[] = [];
  const documents: any[] = [];
  const chunks: any[] = [];

  return {
    organizationMember: {
      findFirst: vi.fn(async ({ where }) => {
        return members.find(
          (m) => m.organizationId === where.organizationId && m.userId === where.userId,
        ) ?? null;
      }),
    },
    companyBrain: {
      findFirst: vi.fn(async ({ where }) => {
        if (brain && brain.organizationId === where.organizationId && brain.name === where.name) {
          return brain;
        }
        return null;
      }),
      create: vi.fn(async ({ data }) => {
        brain = { id: 'brain-1', ...data, createdAt: new Date(), updatedAt: new Date() };
        return brain;
      }),
      update: vi.fn(async ({ data }) => {
        brain = { ...brain, ...data, version: (brain.version ?? 1) + 1 };
        return brain;
      }),
    },
    knowledgeSource: {
      create: vi.fn(async ({ data }) => {
        const newSource = { id: `source-${sources.length + 1}`, ...data, createdAt: new Date() };
        sources.push(newSource);
        return newSource;
      }),
      findMany: vi.fn(async ({ where }) => {
        return sources
          .filter((s) => s.organizationId === where.organizationId)
          .map((s) => ({ ...s, _count: { documents: 1 } }));
      }),
    },
    knowledgeDocument: {
      create: vi.fn(async ({ data }) => {
        const newDoc = { id: `doc-${documents.length + 1}`, ...data, createdAt: new Date() };
        documents.push(newDoc);
        return newDoc;
      }),
    },
    knowledgeChunk: {
      create: vi.fn(async ({ data }) => {
        const newChunk = { id: `chunk-${chunks.length + 1}`, ...data, createdAt: new Date() };
        chunks.push(newChunk);
        return newChunk;
      }),
      findMany: vi.fn(async ({ where }) => {
        return chunks
          .filter((c) => c.organizationId === where.organizationId)
          .map((c) => ({
            ...c,
            document: {
              title: 'Mock Doc',
              source: { sourceUrl: 'https://example.com', type: 'url' },
            },
          }));
      }),
    },
    _sources: sources,
    _chunks: chunks,
  } as unknown as PrismaService & { _sources: any[]; _chunks: any[] };
}

describe('BrainService', () => {
  let service: BrainService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    service = new BrainService(mockPrisma);
  });

  it('retrieves or initializes Company Brain', async () => {
    const brain = await service.getBrain('org-1', 'user-1');
    expect(brain).toBeDefined();
    expect(brain.name).toBe('Primary Brain');
  });

  it('throws ForbiddenException when user is not member of org', async () => {
    await expect(service.getBrain('org-1', 'intruder')).rejects.toThrow(ForbiddenException);
  });

  it('updates brand voice and positioning', async () => {
    const updated = await service.updateBrain(
      'org-1',
      {
        brandVoice: 'Dynamic, witty, and concise',
        positioning: 'Autonomous growth operating department',
      },
      'user-1',
    );

    expect(updated.brandVoice).toBe('Dynamic, witty, and concise');
    expect(updated.positioning).toBe('Autonomous growth operating department');
    expect(updated.version).toBe(2);
  });

  it('rejects SSRF attempts during crawl', async () => {
    const dangerousUrls = [
      'http://localhost:3000',
      'http://127.0.0.1:8080/admin',
      'http://169.254.169.254/latest/meta-data',
    ];

    for (const url of dangerousUrls) {
      await expect(
        service.crawlAndIngestUrl('org-1', { url }, 'user-1'),
      ).rejects.toThrow();
    }
  });

  it('searches semantic memory and ranks matches', async () => {
    // Populate a test chunk in memory with deterministic embedding
    mockPrisma._chunks.push({
      id: 'test-chunk-1',
      organizationId: 'org-1',
      content: 'GrowthOS provides autonomous SEO and competitor analysis agents.',
      tokenCount: 15,
      embedding: new Array(64).fill(0.125), // normalized 64-dim vector
    });

    const results = await service.semanticSearch(
      'org-1',
      { query: 'SEO and competitor agents', minSimilarity: 0.0 },
      'user-1',
    );

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.chunkId).toBe('test-chunk-1');
  });
});
