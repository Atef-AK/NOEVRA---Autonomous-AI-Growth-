/**
 * Vector Search & In-Memory Cosine Ranking
 */
import { cosineSimilarity } from './embeddings';

export interface SearchableItem {
  id: string;
  embedding: number[] | unknown;
  content: string;
  tokenCount?: number;
}

export interface SearchOptions {
  /** Maximum number of matches to return (default: 5) */
  topK?: number;
  /** Minimum cosine similarity threshold (-1.0 to 1.0, default: 0.2) */
  minSimilarity?: number;
}

export interface SearchResult<T extends SearchableItem> {
  item: T;
  similarity: number;
}

/**
 * Perform vector search over a candidate set of items.
 */
export function findSimilarItems<T extends SearchableItem>(
  queryEmbedding: number[],
  items: T[],
  options: SearchOptions = {},
): Array<SearchResult<T>> {
  const topK = options.topK ?? 5;
  const minSimilarity = options.minSimilarity ?? 0.2;

  const scored: Array<SearchResult<T>> = [];

  for (const item of items) {
    if (!Array.isArray(item.embedding) || item.embedding.length === 0) {
      continue;
    }

    const similarity = cosineSimilarity(queryEmbedding, item.embedding as number[]);
    if (similarity >= minSimilarity) {
      scored.push({ item, similarity });
    }
  }

  // Sort descending by similarity
  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}
