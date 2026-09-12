/**
 * Creates a ToolRegistry pre-loaded with all built-in GrowthOS tools.
 * Pass your API keys and connector tokens in config to enable external services.
 */
import { ToolRegistry } from './registry';
import { WebSearchTool } from './builtin/web-search.tool';
import { FetchUrlTool } from './builtin/fetch-url.tool';
import { CalculatorTool } from './builtin/calculator.tool';
import { WebsiteAnalyzerTool } from './builtin/website-analyzer.tool';
import { SeoCrawlTool } from './builtin/seo-crawl.tool';
import { SocialPostTool } from './builtin/social-post.tool';
import { BacklinkBuilderTool } from './builtin/backlink-builder.tool';

export interface DefaultRegistryConfig {
  serpApiKey?: string | undefined;
  braveApiKey?: string | undefined;
  // Social posting tokens
  linkedinAccessToken?: string | undefined;
  twitterBearerToken?: string | undefined;
  twitterAccessToken?: string | undefined;
  twitterAccessSecret?: string | undefined;
  twitterClientId?: string | undefined;
  twitterClientSecret?: string | undefined;
  metaPageAccessToken?: string | undefined;
  metaInstagramAccountId?: string | undefined;
  tiktokAccessToken?: string | undefined;
  redditClientId?: string | undefined;
  redditClientSecret?: string | undefined;
  redditUsername?: string | undefined;
  redditPassword?: string | undefined;
  redditUserAgent?: string | undefined;
}

export function createDefaultRegistry(config: DefaultRegistryConfig = {}): ToolRegistry {
  return new ToolRegistry().register(
    // Core utility tools
    new WebSearchTool({ serpApiKey: config.serpApiKey, braveApiKey: config.braveApiKey }),
    new FetchUrlTool(),
    new CalculatorTool(),
    // Marketing intelligence tools
    new WebsiteAnalyzerTool(),
    new SeoCrawlTool(),
    // Social publishing tool (all platforms)
    new SocialPostTool({
      linkedinAccessToken: config.linkedinAccessToken,
      twitterBearerToken: config.twitterBearerToken,
      twitterAccessToken: config.twitterAccessToken,
      twitterAccessSecret: config.twitterAccessSecret,
      twitterClientId: config.twitterClientId,
      twitterClientSecret: config.twitterClientSecret,
      metaPageAccessToken: config.metaPageAccessToken,
      metaInstagramAccountId: config.metaInstagramAccountId,
      tiktokAccessToken: config.tiktokAccessToken,
      redditClientId: config.redditClientId,
      redditClientSecret: config.redditClientSecret,
      redditUsername: config.redditUsername,
      redditPassword: config.redditPassword,
      redditUserAgent: config.redditUserAgent,
    }),
    // SEO backlink builder
    new BacklinkBuilderTool({
      serpApiKey: config.serpApiKey,
      braveApiKey: config.braveApiKey,
      redditClientId: config.redditClientId,
      redditClientSecret: config.redditClientSecret,
      redditUsername: config.redditUsername,
      redditPassword: config.redditPassword,
      redditUserAgent: config.redditUserAgent,
    }),
  );
}
