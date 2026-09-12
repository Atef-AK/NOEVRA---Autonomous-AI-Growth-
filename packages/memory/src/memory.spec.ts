import { describe, it, expect } from 'vitest';
import { chunkText, estimateTokens } from './chunker';
import {
  cosineSimilarity,
  DeterministicEmbeddingProvider,
} from './embeddings';
import { findSimilarItems } from './vector-search';
import { assembleContext } from './context-assembler';

describe('chunkText', () => {
  it('returns single chunk for short text', () => {
    const text = 'GrowthOS is an autonomous AI growth operating system for SaaS.';
    const chunks = chunkText(text, { maxTokens: 500 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toBe(text);
    expect(chunks[0]?.chunkIndex).toBe(0);
    expect(chunks[0]?.tokenCount).toBeGreaterThan(0);
  });

  it('splits long multi-paragraph text with overlap', () => {
    const p1 = 'First paragraph with detailed brand information and value proposition.'.repeat(20);
    const p2 = 'Second paragraph focusing on SEO keyword strategy and competitor positioning.'.repeat(20);
    const p3 = 'Third paragraph outlining viral distribution tactics and email sequences.'.repeat(20);
    const fullText = `${p1}\n\n${p2}\n\n${p3}`;

    const chunks = chunkText(fullText, { maxTokens: 100, overlapTokens: 20 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.chunkIndex).toBe(0);
    expect(chunks[1]?.chunkIndex).toBe(1);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1.0 for identical vectors', () => {
    const v = [0.6, 0.8];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  it('returns 0.0 for orthogonal vectors', () => {
    const v1 = [1, 0];
    const v2 = [0, 1];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(0.0, 5);
  });

  it('handles empty or zero vectors cleanly', () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe('DeterministicEmbeddingProvider', () => {
  const provider = new DeterministicEmbeddingProvider();

  it('generates normalized 64-dimensional vectors', async () => {
    const vec = await provider.embedQuery('autonomous growth engine');
    expect(vec).toHaveLength(64);

    // Magnitude should be ~1.0
    const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 4);
  });

  it('produces identical vectors for identical inputs', async () => {
    const v1 = await provider.embedQuery('enterprise b2b saas pricing');
    const v2 = await provider.embedQuery('enterprise b2b saas pricing');
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5);
  });

  it('batch embedding matches single embedding', async () => {
    const texts = ['first query', 'second query'];
    const batch = await provider.embedBatch(texts);
    const single0 = await provider.embedQuery(texts[0]!);

    expect(batch).toHaveLength(2);
    expect(cosineSimilarity(batch[0]!, single0)).toBeCloseTo(1.0, 5);
  });
});

describe('findSimilarItems', () => {
  it('ranks items descending by cosine similarity', () => {
    const queryVec = [1, 0, 0];
    const candidates = [
      { id: '1', content: 'distant', embedding: [0, 1, 0] },
      { id: '2', content: 'close', embedding: [0.9, 0.1, 0] },
      { id: '3', content: 'exact', embedding: [1, 0, 0] },
    ];

    const results = findSimilarItems(queryVec, candidates, { topK: 2 });
    expect(results).toHaveLength(2);
    expect(results[0]?.item.id).toBe('3');
    expect(results[0]?.similarity).toBeCloseTo(1.0, 5);
    expect(results[1]?.item.id).toBe('2');
  });

  it('filters out items below minSimilarity threshold', () => {
    const queryVec = [1, 0];
    const candidates = [
      { id: '1', content: 'far', embedding: [0.05, 0.95] },
      { id: '2', content: 'close', embedding: [0.8, 0.2] },
    ];

    const results = findSimilarItems(queryVec, candidates, { minSimilarity: 0.5 });
    expect(results).toHaveLength(1);
    expect(results[0]?.item.id).toBe('2');
  });
});

describe('assembleContext', () => {
  it('formats chunks within token budget', () => {
    const chunks = [
      { title: 'Home Page', content: 'We build autonomous growth agents.', tokenCount: 20 },
      { title: 'Pricing', content: 'Plans start at $49/mo.', tokenCount: 15 },
    ];

    const { contextText, totalTokens, chunksIncluded } = assembleContext(chunks, {
      maxBudgetTokens: 100,
    });

    expect(chunksIncluded).toBe(2);
    expect(totalTokens).toBeLessThanOrEqual(100);
    expect(contextText).toContain('Home Page');
    expect(contextText).toContain('Pricing');
  });
});
