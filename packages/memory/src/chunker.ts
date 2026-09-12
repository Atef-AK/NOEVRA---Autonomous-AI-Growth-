/**
 * Semantic Text Chunker
 * Splits long form text into token-bounded chunks with overlap.
 */

export interface TextChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  startChar: number;
  endChar: number;
}

export interface ChunkerOptions {
  /** Target max tokens per chunk (default: 500) */
  maxTokens?: number;
  /** Overlap in tokens between consecutive chunks (default: 50) */
  overlapTokens?: number;
}

/**
 * Fast token estimation (~4 chars per token for English text).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Chunk text into semantically coherent segments with token overlap.
 */
export function chunkText(text: string, options: ChunkerOptions = {}): TextChunk[] {
  const maxTokens = options.maxTokens ?? 500;
  const overlapTokens = Math.min(options.overlapTokens ?? 50, Math.floor(maxTokens / 2));
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];

  // If text fits in a single chunk
  if (cleaned.length <= maxChars) {
    return [
      {
        chunkIndex: 0,
        content: cleaned,
        tokenCount: estimateTokens(cleaned),
        startChar: 0,
        endChar: cleaned.length,
      },
    ];
  }

  // Split text by paragraph boundaries first
  const paragraphs = cleaned.split(/\n{2,}/);
  const chunks: TextChunk[] = [];

  let currentChunk = '';
  let startChar = 0;
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const candidate = currentChunk ? `${currentChunk}\n\n${para}` : para;

    if (candidate.length <= maxChars) {
      currentChunk = candidate;
    } else {
      // Current chunk is full or candidate exceeds maxChars
      if (currentChunk) {
        chunks.push({
          chunkIndex,
          content: currentChunk.trim(),
          tokenCount: estimateTokens(currentChunk.trim()),
          startChar,
          endChar: startChar + currentChunk.length,
        });
        chunkIndex++;

        // Carry over overlap from the end of currentChunk
        const overlapText = currentChunk.slice(Math.max(0, currentChunk.length - overlapChars));
        startChar += currentChunk.length - overlapText.length;
        currentChunk = `${overlapText}\n\n${para}`;
      } else {
        // Single paragraph exceeds maxChars — split by sentences
        const sentences = para.split(/(?<=[.?!])\s+/);
        for (const sentence of sentences) {
          const sentCandidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;
          if (sentCandidate.length <= maxChars) {
            currentChunk = sentCandidate;
          } else {
            if (currentChunk) {
              chunks.push({
                chunkIndex,
                content: currentChunk.trim(),
                tokenCount: estimateTokens(currentChunk.trim()),
                startChar,
                endChar: startChar + currentChunk.length,
              });
              chunkIndex++;
              startChar += currentChunk.length;
            }
            currentChunk = sentence;
          }
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      chunkIndex,
      content: currentChunk.trim(),
      tokenCount: estimateTokens(currentChunk.trim()),
      startChar,
      endChar: startChar + currentChunk.length,
    });
  }

  return chunks;
}
