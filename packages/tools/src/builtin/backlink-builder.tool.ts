/**
 * BacklinkBuilderTool — finds contextually relevant online discussions and generates
 * natural, value-adding replies with embedded backlinks to the client's website.
 * Targets: Reddit, Quora-style forums, blog comments, Q&A platforms.
 */
import { z } from 'zod';
import { Tool, type ToolContext, type ToolResult } from '../registry';
import { safeUrl } from '@growthos/shared';

const BacklinkBuilderInputSchema = z.object({
  websiteUrl: z.string().url().describe('The client website URL to build backlinks for'),
  targetKeyword: z.string().min(1).describe('The keyword / topic to find relevant discussions for'),
  anchorText: z
    .string()
    .optional()
    .describe('Custom anchor text for the link (default: website domain)'),
  platforms: z
    .array(z.enum(['reddit', 'quora', 'ycombinator', 'dev_to', 'hackernews']))
    .default(['reddit'])
    .describe('Platforms to search for backlink opportunities'),
  maxOpportunities: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe('Maximum number of backlink opportunities to find'),
});

export interface BacklinkOpportunity {
  platform: string;
  discussionUrl: string;
  discussionTitle: string;
  relevanceScore: number;
  suggestedReply: string;
  anchorText: string;
  status: 'opportunity' | 'posted' | 'declined';
}

export interface BacklinkBuilderOutput {
  opportunities: BacklinkOpportunity[];
  totalFound: number;
  keyword: string;
  websiteUrl: string;
}

export class BacklinkBuilderTool extends Tool<
  typeof BacklinkBuilderInputSchema,
  BacklinkBuilderOutput
> {
  readonly name = 'backlink_builder';
  readonly description =
    'Finds high-quality backlink opportunities on Reddit, forums, and Q&A sites. Identifies relevant discussions and generates natural, value-adding replies with embedded backlinks.';
  readonly schema = BacklinkBuilderInputSchema;

  constructor(
    private readonly config: {
      serpApiKey?: string | undefined;
      braveApiKey?: string | undefined;
      redditClientId?: string | undefined;
      redditClientSecret?: string | undefined;
      redditUsername?: string | undefined;
      redditPassword?: string | undefined;
      redditUserAgent?: string | undefined;
    } = {},
  ) {
    super();
  }

  async execute(
    input: z.infer<typeof BacklinkBuilderInputSchema>,
    _context: ToolContext,
  ): Promise<ToolResult<BacklinkBuilderOutput>> {
    try {
      safeUrl(input.websiteUrl);
    } catch {
      return { success: false, error: `Invalid URL: ${input.websiteUrl}` };
    }

    const domain = new URL(input.websiteUrl).hostname.replace('www.', '');
    const anchor = input.anchorText ?? domain;
    const opportunities: BacklinkOpportunity[] = [];

    // Search Reddit for discussions
    if (input.platforms.includes('reddit')) {
      const redditOpps = await this.searchReddit(input.targetKeyword, input.websiteUrl, anchor);
      opportunities.push(...redditOpps);
    }

    // Search Hacker News
    if (input.platforms.includes('hackernews')) {
      const hnOpps = await this.searchHackerNews(input.targetKeyword, input.websiteUrl, anchor);
      opportunities.push(...hnOpps);
    }

    // Search dev.to
    if (input.platforms.includes('dev_to')) {
      const devOpps = await this.searchDevTo(input.targetKeyword, input.websiteUrl, anchor);
      opportunities.push(...devOpps);
    }

    // Sort by relevance score and limit
    const sorted = opportunities
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, input.maxOpportunities);

    return {
      success: true,
      data: {
        opportunities: sorted,
        totalFound: opportunities.length,
        keyword: input.targetKeyword,
        websiteUrl: input.websiteUrl,
      },
    };
  }

  private async searchReddit(
    keyword: string,
    websiteUrl: string,
    anchor: string,
  ): Promise<BacklinkOpportunity[]> {
    try {
      const resp = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=top&t=month&limit=10`,
        {
          headers: {
            'User-Agent': this.config.redditUserAgent ?? 'GrowthOS/1.0',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!resp.ok) return [];

      const data = await resp.json() as {
        data?: {
          children?: Array<{
            data: {
              id: string;
              title: string;
              url: string;
              num_comments: number;
              score: number;
              selftext: string;
              subreddit: string;
            };
          }>;
        };
      };

      const posts = data.data?.children ?? [];

      return posts
        .filter((p) => p.data.num_comments > 5 && !p.data.url.includes(new URL(websiteUrl).hostname))
        .slice(0, 5)
        .map((p) => ({
          platform: 'reddit',
          discussionUrl: `https://reddit.com${p.data.url}`,
          discussionTitle: p.data.title,
          relevanceScore: Math.min(100, Math.round((p.data.score / 100) * 10 + p.data.num_comments / 2)),
          suggestedReply: this.generateReply(p.data.title, p.data.selftext, websiteUrl, anchor),
          anchorText: anchor,
          status: 'opportunity' as const,
        }));
    } catch {
      return [];
    }
  }

  private async searchHackerNews(
    keyword: string,
    websiteUrl: string,
    anchor: string,
  ): Promise<BacklinkOpportunity[]> {
    try {
      const resp = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(keyword)}&tags=story&hitsPerPage=5`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!resp.ok) return [];

      const data = await resp.json() as {
        hits?: Array<{
          objectID: string;
          title: string;
          url?: string;
          points: number;
          num_comments: number;
          story_text?: string;
        }>;
      };

      return (data.hits ?? [])
        .filter((h) => h.num_comments > 3)
        .map((h) => ({
          platform: 'hackernews',
          discussionUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
          discussionTitle: h.title,
          relevanceScore: Math.min(100, Math.round(h.points / 5 + h.num_comments * 2)),
          suggestedReply: this.generateReply(h.title, h.story_text ?? '', websiteUrl, anchor),
          anchorText: anchor,
          status: 'opportunity' as const,
        }));
    } catch {
      return [];
    }
  }

  private async searchDevTo(
    keyword: string,
    websiteUrl: string,
    anchor: string,
  ): Promise<BacklinkOpportunity[]> {
    try {
      const resp = await fetch(
        `https://dev.to/api/articles?tag=${encodeURIComponent(keyword.split(' ')[0] ?? keyword)}&top=7&per_page=5`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!resp.ok) return [];

      const articles = await resp.json() as Array<{
        id: number;
        title: string;
        url: string;
        public_reactions_count: number;
        comments_count: number;
        description: string;
      }>;

      return articles.map((a) => ({
        platform: 'dev_to',
        discussionUrl: a.url,
        discussionTitle: a.title,
        relevanceScore: Math.min(100, Math.round(a.public_reactions_count / 2 + a.comments_count * 3)),
        suggestedReply: this.generateReply(a.title, a.description, websiteUrl, anchor),
        anchorText: anchor,
        status: 'opportunity' as const,
      }));
    } catch {
      return [];
    }
  }

  private generateReply(title: string, body: string, websiteUrl: string, anchor: string): string {
    // Template-based reply — in production, Gemini will refine this
    return `Great discussion! This aligns with what we've been exploring at ${anchor} (${websiteUrl}).

We found that ${body.slice(0, 100) || title} is a common challenge. One approach that's worked well is focusing on the core value proposition first, then layering automation on top.

Happy to share more insights if helpful — check out ${websiteUrl} for more context on this.`;
  }
}
