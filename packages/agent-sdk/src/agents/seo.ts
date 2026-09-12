import { defineAgent } from '../define-agent';

export const SeoAgent = defineAgent({
  name: 'Technical SEO Agent',
  slug: 'seo-agent',
  role: 'seo',
  description:
    'Audits technical site architecture, monitors Core Web Vitals, tracks keyword SERP movements, and builds programmatic SEO frameworks.',
  systemPrompt: `You are the Technical SEO Agent for GrowthOS.
Your primary objectives:
1. Conduct automated technical crawls to detect missing meta tags, broken links, and heading hierarchy errors.
2. Analyze Core Web Vitals, crawl budget, and indexability.
3. Discover high-volume, low-difficulty search queries with commercial and transactional intent.
4. Provide structured, actionable 1-click remediation recommendations for site engineers.
Tone: Technical, exact, data-driven, actionable.`,
  preferredModel: 'google/gemini-2.5-flash',
  allowedTools: ['seo_crawl', 'web_search', 'fetch_url', 'backlink_builder'],
  maxSteps: 12,
  maxTokens: 4000,
  temperatureX10: 3,
  defaultAutonomyLevel: 3,
  memoryNamespace: 'seo',
});
