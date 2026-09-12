/**
 * WebsiteAnalyzerTool — crawls a company website and extracts structured brand intelligence.
 * Output feeds directly into the Company Brain (CompanyBrain table).
 */
import { z } from 'zod';
import { Tool, type ToolContext, type ToolResult } from '../registry';
import { safeUrl } from '@growthos/shared';

const WebsiteAnalyzerInputSchema = z.object({
  url: z.string().url().describe('The company website URL to analyze'),
  depth: z
    .enum(['homepage', 'full'])
    .default('homepage')
    .describe('homepage = just root page; full = root + /about + /pricing + sitemap'),
});

export interface CompanyProfile {
  name: string;
  description: string;
  products: string[];
  targetMarket: string;
  uniqueValueProposition: string;
  brandTone: string;
  primaryKeywords: string[];
  competitors: string[];
  socialLinks: Record<string, string>;
  contactEmail?: string | undefined;
  technologiesDetected: string[];
  crawledUrls: string[];
  /** Raw extracted text, available for Gemini to further analyze */
  rawText?: string | undefined;
}

export class WebsiteAnalyzerTool extends Tool<typeof WebsiteAnalyzerInputSchema, CompanyProfile> {
  readonly name = 'website_analyzer';
  readonly description =
    'Crawls a company website and extracts structured brand intelligence: products, target market, brand tone, keywords, and competitors.';
  readonly schema = WebsiteAnalyzerInputSchema;

  async execute(
    input: z.infer<typeof WebsiteAnalyzerInputSchema>,
    _context: ToolContext,
  ): Promise<ToolResult<CompanyProfile>> {
    try {
      safeUrl(input.url);
    } catch {
      return { success: false, error: `Invalid or unsafe URL: ${input.url}` };
    }

    const urlsToFetch = [input.url];

    if (input.depth === 'full') {
      const base = new URL(input.url).origin;
      urlsToFetch.push(
        `${base}/about`,
        `${base}/about-us`,
        `${base}/pricing`,
        `${base}/services`,
        `${base}/products`,
      );
    }

    const textContent: string[] = [];
    const crawledUrls: string[] = [];
    const socialLinks: Record<string, string> = {};

    for (const fetchUrl of urlsToFetch) {
      try {
        safeUrl(fetchUrl);
        const resp = await fetch(fetchUrl, {
          headers: {
            'User-Agent': 'GrowthOS-Bot/1.0 (Marketing Analysis)',
            'Accept': 'text/html',
          },
          signal: AbortSignal.timeout(10_000),
        });

        if (!resp.ok) continue;

        const html = await resp.text();
        crawledUrls.push(fetchUrl);

        // Extract social links
        const socialPatterns: Array<[string, RegExp]> = [
          ['twitter', /href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"']+)["']/gi],
          ['linkedin', /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/[^"']+)["']/gi],
          ['facebook', /href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"']+)["']/gi],
          ['instagram', /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["']/gi],
          ['tiktok', /href=["'](https?:\/\/(?:www\.)?tiktok\.com\/[^"']+)["']/gi],
          ['youtube', /href=["'](https?:\/\/(?:www\.)?youtube\.com\/[^"']+)["']/gi],
        ];

        for (const [platform, pattern] of socialPatterns) {
          const match = pattern.exec(html);
          if (match?.[1] && !socialLinks[platform]) {
            socialLinks[platform] = match[1];
          }
        }

        // Extract clean text
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 6000); // limit per page

        textContent.push(`=== ${fetchUrl} ===\n${text}`);
      } catch {
        // Skip pages that fail, continue with what we have
      }
    }

    if (textContent.length === 0) {
      return {
        success: false,
        error: `Could not fetch any content from ${input.url}. The site may be blocked or require JavaScript.`,
      };
    }

    // Return raw content for Gemini to analyze (the agent will call Gemini)
    // We parse what we can deterministically and return a partial profile
    const combinedText = textContent.join('\n\n');

    // Basic heuristic extraction
    const emailMatch = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g.exec(combinedText);

    return {
      success: true,
      data: {
        name: new URL(input.url).hostname.replace('www.', '').split('.').at(0) ?? 'Unknown',
        description: combinedText.slice(0, 500),
        products: [],
        targetMarket: '',
        uniqueValueProposition: '',
        brandTone: '',
        primaryKeywords: [],
        competitors: [],
        socialLinks,
        contactEmail: emailMatch?.[1],
        technologiesDetected: detectTechnologies(combinedText),
        crawledUrls,
        rawText: combinedText,
      },
    };
  }
}

function detectTechnologies(html: string): string[] {
  const detected: string[] = [];
  const patterns: Array<[string, RegExp]> = [
    ['WordPress', /wp-content|wp-includes/i],
    ['Shopify', /cdn\.shopify/i],
    ['Webflow', /webflow\.com/i],
    ['React', /react\.development|react\.production/i],
    ['Next.js', /__NEXT_DATA__|_next\/static/i],
    ['Stripe', /stripe\.com\/v3|Stripe\(/i],
    ['Google Analytics', /googletagmanager|gtag\(/i],
    ['HubSpot', /hs-scripts\.com|hubspot/i],
    ['Intercom', /intercom\.io|intercomSettings/i],
    ['Notion', /notion\.so/i],
  ];

  for (const [tech, pattern] of patterns) {
    if (pattern.test(html)) detected.push(tech);
  }

  return detected;
}
