import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Embedding Providers and Vector Similarity Functions
 */

export interface EmbeddingProvider {
  readonly dimensions: number;
  embedQuery(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * Compute cosine similarity between two numeric vectors.
 * Returns value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized text embeddings).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * OpenAI text-embedding-3-small provider (1536 dimensions).
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 1536;

  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'text-embedding-3-small',
  ) {}

  async embedQuery(text: string): Promise<number[]> {
    const [embedding] = await this.embedBatch([text]);
    if (!embedding) throw new Error('No embedding returned by OpenAI');
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI embedding failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
    };

    return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }
}

/**
 * Deterministic projection embedding provider for test environments & offline development.
 * Produces a stable, normalized 64-dimensional vector from token hashes.
 */
export class DeterministicEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 64;

  async embedQuery(text: string): Promise<number[]> {
    return this.generateVector(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.generateVector(t));
  }

  private generateVector(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);

    for (let w = 0; w < words.length; w++) {
      const word = words[w] ?? '';
      for (let c = 0; c < word.length; c++) {
        const charCode = word.charCodeAt(c);
        const idx = (charCode * 31 + c * 17 + w) % this.dimensions;
        vector[idx] = (vector[idx] ?? 0) + 1;
      }
    }

    // Normalize to unit length
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const val = vector[i] ?? 0;
      norm += val * val;
    }

    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] = (vector[i] ?? 0) / norm;
      }
    }

    return vector;
  }
}

/**
 * Google Gemini text-embedding-001 provider (3072 dimensions).
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 3072;
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-embedding-001') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async embedQuery(text: string): Promise<number[]> {
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const result = await model.embedContent(text);
    if (!result.embedding?.values) {
      throw new Error('No embedding values returned by Gemini');
    }
    return result.embedding.values;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const results: number[][] = [];
    for (const text of texts) {
      const result = await model.embedContent(text);
      if (!result.embedding?.values) {
        throw new Error('No embedding values returned by Gemini');
      }
      results.push(result.embedding.values);
    }
    return results;
  }
}
