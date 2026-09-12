/**
 * WebSearchTool — searches the web using a configurable search API.
 * Phase 2: Uses SerpAPI (real). Falls back to Brave Search if configured.
 * SSRF protection: only fetches external HTTP(S) endpoints.
 */
import { z } from 'zod';
import { Tool, type ToolContext, type ToolResult } from '../registry';
import { safeUrl } from '@growthos/shared';

const WebSearchInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(500)
    .describe('The search query to execute'),
  numResults: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe('Number of results to return (default: 5)'),
});

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

export interface WebSearchOutput {
  query: string;
  results: WebSearchResult[];
  totalResults?: number | undefined;
}

export class WebSearchTool extends Tool<typeof WebSearchInputSchema, WebSearchOutput> {
  readonly name = 'web_search';
  readonly description =
    'Search the web for up-to-date information. Returns a list of search results with titles, URLs, and snippets.';
  readonly schema = WebSearchInputSchema;

  constructor(
    private readonly config: {
      serpApiKey?: string | undefined;
      braveApiKey?: string | undefined;
    } = {},
  ) {
    super();
  }

  async execute(
    input: z.infer<typeof WebSearchInputSchema>,
    _context: ToolContext,
  ): Promise<ToolResult<WebSearchOutput>> {
    const numResults = input.numResults ?? 5;

    // Try SerpAPI first
    if (this.config.serpApiKey) {
      try {
        return await this.searchWithSerpApi(input.query, numResults, this.config.serpApiKey);
      } catch (err) {
        // Fall through to next provider
        console.warn('[WebSearchTool] SerpAPI failed:', err);
      }
    }

    // Try Brave Search
    if (this.config.braveApiKey) {
      try {
        return await this.searchWithBrave(input.query, numResults, this.config.braveApiKey);
      } catch (err) {
        console.warn('[WebSearchTool] Brave Search failed:', err);
      }
    }

    // No search API configured — return a clear error (not fake results)
    return {
      success: false,
      error:
        'No search API is configured. Set SERPAPI_API_KEY or BRAVE_SEARCH_API_KEY in .env to enable web search.',
    };
  }

  private async searchWithSerpApi(
    query: string,
    numResults: number,
    apiKey: string,
  ): Promise<ToolResult<WebSearchOutput>> {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(numResults));
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('engine', 'google');

    // Validate URL is safe (no private IPs)
    safeUrl(url.toString());

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'GrowthOS/1.0' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`SerpAPI HTTP ${response.status}`);
    }

    const data = await response.json() as {
      organic_results?: Array<{ title: string; link: string; snippet: string; position: number }>;
      search_information?: { total_results?: number };
    };

    const results: WebSearchResult[] = (data.organic_results ?? [])
      .slice(0, numResults)
      .map(r => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
        position: r.position,
      }));

    return {
      success: true,
      data: {
        query,
        results,
        totalResults: data.search_information?.total_results,
      },
    };
  }

  private async searchWithBrave(
    query: string,
    numResults: number,
    apiKey: string,
  ): Promise<ToolResult<WebSearchOutput>> {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(numResults));

    await safeUrl(url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
        'User-Agent': 'GrowthOS/1.0',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Brave Search HTTP ${response.status}`);
    }

    const data = await response.json() as {
      web?: { results?: Array<{ title: string; url: string; description: string }> };
    };

    const results: WebSearchResult[] = (data.web?.results ?? [])
      .slice(0, numResults)
      .map((r, idx) => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        position: idx + 1,
      }));

    return {
      success: true,
      data: { query, results },
    };
  }
}
