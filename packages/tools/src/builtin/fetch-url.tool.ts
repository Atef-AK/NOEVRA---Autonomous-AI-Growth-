/**
 * FetchUrlTool — fetches and extracts readable text from a URL.
 * Protected against SSRF via @growthos/shared safeUrl().
 */
import { z } from 'zod';
import { Tool, type ToolContext, type ToolResult } from '../registry';
import { safeUrl } from '@growthos/shared';

const FetchUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to fetch content from'),
  extractText: z
    .boolean()
    .optional()
    .describe('If true (default), strip HTML tags and return plain text'),
  maxChars: z
    .number()
    .int()
    .min(100)
    .max(50_000)
    .optional()
    .describe('Maximum characters to return (default: 8000)'),
});

export interface FetchUrlOutput {
  url: string;
  title: string | null;
  content: string;
  contentLength: number;
  statusCode: number;
  contentType: string | null;
}

function stripHtml(html: string): string {
  // Remove script and style blocks
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ');

  // Extract title
  const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1]?.trim() ?? null : null;

  // Replace block elements with newlines
  text = text
    .replace(/<\/?(h[1-6]|p|div|br|li|tr|td|th|section|article|header)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '') // strip remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n') // collapse excessive newlines
    .trim();

  return title ? `# ${title}\n\n${text}` : text;
}

export class FetchUrlTool extends Tool<typeof FetchUrlInputSchema, FetchUrlOutput> {
  readonly name = 'fetch_url';
  readonly description =
    'Fetch the content of a URL and return it as readable text. ' +
    'Use this to read web pages, documentation, or any public URL. ' +
    'Cannot access private network addresses.';
  readonly schema = FetchUrlInputSchema;

  async execute(
    input: z.infer<typeof FetchUrlInputSchema>,
    _context: ToolContext,
  ): Promise<ToolResult<FetchUrlOutput>> {
    // SSRF protection — throws if URL is private/loopback/non-HTTP
    await safeUrl(input.url);

    const maxChars = input.maxChars ?? 8_000;
    const extractText = input.extractText !== false;

    const response = await fetch(input.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; GrowthOS/1.0; +https://growthos.ai/bot)',
        Accept: 'text/html,text/plain,application/json,*/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });

    const contentType = response.headers.get('content-type') ?? null;
    const rawText = await response.text();

    let content: string;
    let title: string | null = null;

    if (extractText && contentType?.includes('text/html')) {
      const titleMatch = rawText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      title = titleMatch ? titleMatch[1]?.trim() ?? null : null;
      content = stripHtml(rawText).slice(0, maxChars);
    } else {
      content = rawText.slice(0, maxChars);
    }

    return {
      success: true,
      data: {
        url: input.url,
        title,
        content,
        contentLength: rawText.length,
        statusCode: response.status,
        contentType,
      },
    };
  }
}
