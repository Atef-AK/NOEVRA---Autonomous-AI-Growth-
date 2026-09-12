/**
 * Context Assembler
 * Assembles retrieved knowledge chunks and memories into a structured
 * prompt context block within a specified token budget.
 */
import { estimateTokens } from './chunker';

export interface ContextChunk {
  content: string;
  title?: string;
  sourceUrl?: string;
  tokenCount?: number;
  similarity?: number;
}

export interface AssembleContextOptions {
  /** Maximum token budget for the assembled context (default: 2000) */
  maxBudgetTokens?: number;
  /** Header label for the context block */
  header?: string;
}

export function assembleContext(
  chunks: ContextChunk[],
  options: AssembleContextOptions = {},
): { contextText: string; totalTokens: number; chunksIncluded: number } {
  const maxBudget = options.maxBudgetTokens ?? 2000;
  const header = options.header ?? '### Relevant Company Knowledge & Background Context:';

  if (chunks.length === 0) {
    return { contextText: '', totalTokens: 0, chunksIncluded: 0 };
  }

  const sections: string[] = [];
  let currentTokens = estimateTokens(header);
  let includedCount = 0;

  for (const chunk of chunks) {
    const titleHeader = chunk.title ? `**Source: ${chunk.title}**\n` : '';
    const formatted = `${titleHeader}${chunk.content.trim()}`;
    const chunkTokens = chunk.tokenCount ?? estimateTokens(formatted);

    if (currentTokens + chunkTokens > maxBudget && includedCount > 0) {
      break; // stop when exceeding budget
    }

    sections.push(formatted);
    currentTokens += chunkTokens;
    includedCount++;
  }

  const contextText = `${header}\n\n${sections.join('\n\n---\n\n')}`;
  return {
    contextText,
    totalTokens: currentTokens,
    chunksIncluded: includedCount,
  };
}
