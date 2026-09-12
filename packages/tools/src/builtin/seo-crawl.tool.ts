/**
 * SeoCrawlTool — fetches a URL and extracts structured SEO signals.
 * Returns metadata, heading structure, link analysis, and technical signals
 * so that the SEO Agent can reason about optimization opportunities.
 */
import { z } from 'zod';
import { Tool, type ToolContext, type ToolResult } from '../registry';
import { safeUrl } from '@growthos/shared';

const SeoCrawlInputSchema = z.object({
  url: z.string().url().describe('The URL to crawl and analyze for SEO signals'),
  followLinks: z
    .boolean()
    .default(false)
    .describe('If true, also crawl internal links found on the page (max 5)'),
});

export interface SeoPageData {
  url: string;
  statusCode: number;
  title: string | null;
  metaDescription: string | null;
  metaRobots: string | null;
  canonicalUrl: string | null;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  internalLinks: string[];
  externalLinks: string[];
  imagesMissingAlt: number;
  totalImages: number;
  wordCount: number;
  hasStructuredData: boolean;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  loadTimeMs: number;
  issues: SeoIssue[];
}

export interface SeoIssue {
  severity: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
}

export interface SeoCrawlOutput {
  pages: SeoPageData[];
  summary: {
    totalPages: number;
    criticalIssues: number;
    warningIssues: number;
    overallScore: number;
  };
}

export class SeoCrawlTool extends Tool<typeof SeoCrawlInputSchema, SeoCrawlOutput> {
  readonly name = 'seo_crawl';
  readonly description =
    'Crawls a URL and extracts structured SEO signals: meta tags, heading hierarchy, link analysis, structured data, and identifies technical SEO issues.';
  readonly schema = SeoCrawlInputSchema;

  async execute(
    input: z.infer<typeof SeoCrawlInputSchema>,
    _context: ToolContext,
  ): Promise<ToolResult<SeoCrawlOutput>> {
    try {
      safeUrl(input.url);
    } catch {
      return { success: false, error: `Unsafe URL: ${input.url}` };
    }

    const pages: SeoPageData[] = [];
    const urlsToProcess = [input.url];
    const visited = new Set<string>();

    for (const pageUrl of urlsToProcess.slice(0, input.followLinks ? 6 : 1)) {
      if (visited.has(pageUrl)) continue;
      visited.add(pageUrl);

      const pageData = await this.crawlPage(pageUrl, input.url);
      if (pageData) {
        pages.push(pageData);

        if (input.followLinks && pages.length < 6) {
          // Add unvisited internal links
          for (const link of pageData.internalLinks.slice(0, 3)) {
            if (!visited.has(link)) urlsToProcess.push(link);
          }
        }
      }
    }

    const criticalIssues = pages.reduce(
      (sum, p) => sum + p.issues.filter((i) => i.severity === 'critical').length,
      0,
    );
    const warningIssues = pages.reduce(
      (sum, p) => sum + p.issues.filter((i) => i.severity === 'warning').length,
      0,
    );

    // Simple score: 100 - (criticals * 15) - (warnings * 5), min 0
    const overallScore = Math.max(0, 100 - criticalIssues * 15 - warningIssues * 5);

    return {
      success: true,
      data: {
        pages,
        summary: {
          totalPages: pages.length,
          criticalIssues,
          warningIssues,
          overallScore,
        },
      },
    };
  }

  private async crawlPage(url: string, baseUrl: string): Promise<SeoPageData | null> {
    const start = Date.now();
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'GrowthOS-SEO-Bot/1.0',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(15_000),
        redirect: 'follow',
      });

      const loadTimeMs = Date.now() - start;
      const html = await resp.text();
      const base = new URL(baseUrl).origin;

      const issues: SeoIssue[] = [];

      // Title
      const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
      const title = titleMatch?.[1]?.trim() ?? null;
      if (!title) issues.push({ severity: 'critical', code: 'MISSING_TITLE', message: 'Page has no <title> tag' });
      else if (title.length > 60) issues.push({ severity: 'warning', code: 'TITLE_TOO_LONG', message: `Title is ${title.length} chars (recommended ≤60)` });
      else if (title.length < 30) issues.push({ severity: 'warning', code: 'TITLE_TOO_SHORT', message: `Title is ${title.length} chars (recommended ≥30)` });

      // Meta description
      const descMatch = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(html)
        ?? /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i.exec(html);
      const metaDescription = descMatch?.[1]?.trim() ?? null;
      if (!metaDescription) issues.push({ severity: 'critical', code: 'MISSING_META_DESC', message: 'Missing meta description' });
      else if (metaDescription.length > 160) issues.push({ severity: 'warning', code: 'META_DESC_TOO_LONG', message: `Meta description is ${metaDescription.length} chars (recommended ≤160)` });

      // Meta robots
      const robotsMatch = /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i.exec(html);
      const metaRobots = robotsMatch?.[1] ?? null;
      if (metaRobots?.includes('noindex')) issues.push({ severity: 'critical', code: 'NOINDEX', message: 'Page has noindex directive — will not be indexed' });

      // Canonical
      const canonicalMatch = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i.exec(html);
      const canonicalUrl = canonicalMatch?.[1] ?? null;

      // H1 tags
      const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
      const h1Tags = h1Matches.map(m => (m[1] ?? '').replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      if (h1Tags.length === 0) issues.push({ severity: 'critical', code: 'MISSING_H1', message: 'No H1 tag found' });
      if (h1Tags.length > 1) issues.push({ severity: 'warning', code: 'MULTIPLE_H1', message: `Found ${h1Tags.length} H1 tags (recommended: 1)` });

      const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
      const h2Tags = h2Matches.map(m => (m[1] ?? '').replace(/<[^>]+>/g, '').trim()).filter(Boolean);

      const h3Matches = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)];
      const h3Tags = h3Matches.map(m => (m[1] ?? '').replace(/<[^>]+>/g, '').trim()).filter(Boolean);

      // Links
      const linkMatches = [...html.matchAll(/href=["']([^"'#?]+)["']/gi)];
      const internalLinks: string[] = [];
      const externalLinks: string[] = [];

      for (const match of linkMatches) {
        const href = match[1];
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
        try {
          const resolved = new URL(href, base).toString();
          if (resolved.startsWith(base)) internalLinks.push(resolved);
          else externalLinks.push(resolved);
        } catch { /* skip */ }
      }

      // Images
      const imgMatches = [...html.matchAll(/<img[^>]*/gi)];
      const totalImages = imgMatches.length;
      const imagesMissingAlt = imgMatches.filter(m => !m[0].includes('alt=')).length;
      if (imagesMissingAlt > 0) issues.push({ severity: 'warning', code: 'IMAGES_MISSING_ALT', message: `${imagesMissingAlt}/${totalImages} images missing alt text` });

      // Word count
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const wordCount = text.split(' ').filter(Boolean).length;
      if (wordCount < 300) issues.push({ severity: 'warning', code: 'THIN_CONTENT', message: `Page has only ${wordCount} words (recommended ≥300)` });

      // Structured data
      const hasStructuredData = html.includes('application/ld+json');
      if (!hasStructuredData) issues.push({ severity: 'info', code: 'NO_STRUCTURED_DATA', message: 'No JSON-LD structured data found' });

      // OG + Twitter
      const hasOpenGraph = html.includes('og:title') || html.includes('og:description');
      const hasTwitterCard = html.includes('twitter:card');
      if (!hasOpenGraph) issues.push({ severity: 'warning', code: 'MISSING_OG', message: 'No Open Graph tags — affects social sharing' });

      // Load time
      if (loadTimeMs > 3000) issues.push({ severity: 'warning', code: 'SLOW_PAGE', message: `Page loaded in ${loadTimeMs}ms (recommended <3000ms)` });

      return {
        url,
        statusCode: resp.status,
        title,
        metaDescription,
        metaRobots,
        canonicalUrl,
        h1Tags,
        h2Tags: h2Tags.slice(0, 10),
        h3Tags: h3Tags.slice(0, 15),
        internalLinks: [...new Set(internalLinks)].slice(0, 50),
        externalLinks: [...new Set(externalLinks)].slice(0, 20),
        imagesMissingAlt,
        totalImages,
        wordCount,
        hasStructuredData,
        hasOpenGraph,
        hasTwitterCard,
        loadTimeMs,
        issues,
      };
    } catch (err) {
      return null;
    }
  }
}
