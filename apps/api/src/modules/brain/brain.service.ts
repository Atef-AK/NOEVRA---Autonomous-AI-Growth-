import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { Prisma } from '@growthos/database';
import { safeUrl } from '@growthos/shared';
import { getEnv } from '@growthos/config';
import {
  chunkText,
  estimateTokens,
  findSimilarItems,
  GeminiEmbeddingProvider,
  OpenAIEmbeddingProvider,
  DeterministicEmbeddingProvider,
  type EmbeddingProvider,
  type SearchableItem,
} from '@growthos/memory';
import type { CrawlUrlDto, UpdateBrainDto, QueryBrainDto } from './dto/brain.dto';

@Injectable()
export class BrainService {
  private readonly logger = new Logger(BrainService.name);
  private readonly env = getEnv();
  private readonly embeddingProvider: EmbeddingProvider;

  constructor(private readonly prisma: PrismaService) {
    if (this.env.GOOGLE_AI_API_KEY) {
      this.logger.log('BrainService: Initialized with GeminiEmbeddingProvider (3072-dim)');
      this.embeddingProvider = new GeminiEmbeddingProvider(this.env.GOOGLE_AI_API_KEY);
    } else if (this.env.OPENAI_API_KEY && !this.env.OPENAI_API_KEY.includes('placeholder')) {
      this.logger.log('BrainService: Initialized with OpenAIEmbeddingProvider');
      this.embeddingProvider = new OpenAIEmbeddingProvider(this.env.OPENAI_API_KEY);
    } else {
      this.logger.log('BrainService: Initialized with DeterministicEmbeddingProvider');
      this.embeddingProvider = new DeterministicEmbeddingProvider();
    }
  }

  async getBrain(organizationId: string, requestingUserId: string) {
    await this.verifyOrgMembership(organizationId, requestingUserId);

    let brain = await this.prisma.companyBrain.findFirst({
      where: { organizationId, name: 'Primary Brain' },
    });

    if (!brain) {
      // Auto-initialize primary brain if not yet created
      brain = await this.prisma.companyBrain.create({
        data: {
          organizationId,
          name: 'Primary Brain',
          summary: 'Company knowledge base automatically compiled from ingested sources.',
          brandVoice: 'Professional, informative, data-driven, and authoritative.',
          targetAudience: 'Target market prospective customers and existing clients.',
          valueProps: [],
          competitors: [],
          positioning: 'Leading growth solution.',
          version: 1,
        },
      });
    }

    return brain;
  }

  async updateBrain(organizationId: string, dto: UpdateBrainDto, requestingUserId: string) {
    const existing = await this.getBrain(organizationId, requestingUserId);

    return this.prisma.companyBrain.update({
      where: { id: existing.id },
      data: {
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.brandVoice !== undefined ? { brandVoice: dto.brandVoice } : {}),
        ...(dto.targetAudience !== undefined ? { targetAudience: dto.targetAudience } : {}),
        ...(dto.valueProps !== undefined ? { valueProps: dto.valueProps } : {}),
        ...(dto.competitors !== undefined ? { competitors: dto.competitors } : {}),
        ...(dto.positioning !== undefined ? { positioning: dto.positioning } : {}),
        version: { increment: 1 },
      },
    });
  }

  async crawlAndIngestUrl(organizationId: string, dto: CrawlUrlDto, requestingUserId: string) {
    await this.verifyOrgMembership(organizationId, requestingUserId);

    // 1. SSRF check
    await safeUrl(dto.url);

    // 2. Fetch page HTML
    let html = '';
    let title = dto.url;
    try {
      const response = await fetch(dto.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GrowthOS/1.0; +https://growthos.ai/bot)',
          Accept: 'text/html,text/plain,*/*',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new BadRequestException(`Failed to crawl URL: HTTP ${response.status}`);
      }

      html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch?.[1]) {
        title = titleMatch[1].trim();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fetch failed';
      throw new BadRequestException(`Could not crawl "${dto.url}": ${msg}`);
    }

    // 3. Extract readable text
    const cleanText = this.stripHtml(html);
    if (!cleanText || cleanText.length < 20) {
      throw new BadRequestException('Crawled URL contained insufficient textual content.');
    }

    // 4. Create KnowledgeSource
    const source = await this.prisma.knowledgeSource.create({
      data: {
        organizationId,
        projectId: dto.projectId ?? null,
        type: 'url',
        sourceUrl: dto.url,
        title,
        status: 'ready',
        lastCrawledAt: new Date(),
        metadata: { contentLength: cleanText.length },
      },
    });

    // 5. Create KnowledgeDocument
    const document = await this.prisma.knowledgeDocument.create({
      data: {
        sourceId: source.id,
        organizationId,
        title,
        content: cleanText,
        contentType: 'text/plain',
        tokenCount: estimateTokens(cleanText),
      },
    });

    // 6. Semantic Chunking
    const textChunks = chunkText(cleanText, { maxTokens: 400, overlapTokens: 40 });

    // 7. Embeddings Generation
    const chunkContents = textChunks.map((c: { content: string }) => c.content);
    const embeddings = await this.embeddingProvider.embedBatch(chunkContents);

    // 8. Persist Chunks with Embeddings
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i]!;
      const embedding = embeddings[i] ?? null;

      await this.prisma.knowledgeChunk.create({
        data: {
          documentId: document.id,
          organizationId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          embedding: embedding !== null ? (embedding as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      });
    }

    // 9. Update Company Brain summary if empty
    const brain = await this.getBrain(organizationId, requestingUserId);
    if (!brain.summary || brain.summary.includes('automatically compiled')) {
      const summarySnippet = cleanText.slice(0, 300) + '...';
      await this.prisma.companyBrain.update({
        where: { id: brain.id },
        data: {
          summary: `Extracted from ${title} (${dto.url}): ${summarySnippet}`,
        },
      });
    }

    return {
      sourceId: source.id,
      documentId: document.id,
      title,
      chunksCreated: textChunks.length,
      totalTokens: document.tokenCount,
    };
  }

  async semanticSearch(organizationId: string, dto: QueryBrainDto, requestingUserId: string) {
    await this.verifyOrgMembership(organizationId, requestingUserId);

    // Generate query embedding
    const queryVector = await this.embeddingProvider.embedQuery(dto.query);

    // Fetch candidate chunks for the organization
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { organizationId },
      include: {
        document: {
          select: {
            title: true,
            source: {
              select: {
                sourceUrl: true,
                type: true,
              },
            },
          },
        },
      },
      take: 200, // retrieve candidate pool
    });

    const candidateItems: SearchableItem[] = chunks.map((c) => ({
      id: c.id,
      content: c.content,
      tokenCount: c.tokenCount,
      embedding: c.embedding,
    }));

    // In-memory vector similarity ranking
    const matches = findSimilarItems(queryVector, candidateItems, {
      topK: dto.topK ?? 5,
      minSimilarity: dto.minSimilarity ?? 0.2,
    });

    return matches.map((m: { item: SearchableItem; similarity: number }) => {
      const chunkRecord = chunks.find((c) => c.id === m.item.id);
      return {
        chunkId: m.item.id,
        content: m.item.content,
        similarity: Math.round(m.similarity * 1000) / 1000,
        tokenCount: m.item.tokenCount ?? estimateTokens(m.item.content),
        documentTitle: chunkRecord?.document.title ?? 'Document',
        sourceUrl: chunkRecord?.document.source.sourceUrl ?? null,
      };
    });
  }

  async listSources(organizationId: string, requestingUserId: string) {
    await this.verifyOrgMembership(organizationId, requestingUserId);

    return this.prisma.knowledgeSource.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<\/?(h[1-6]|p|div|br|li|tr|td|th|section|article|header)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
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
