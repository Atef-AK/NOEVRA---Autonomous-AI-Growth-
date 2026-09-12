import { AgentDefinition, AgentRole } from './types';
import { ExecutiveAgent } from './agents/executive';
import { StrategyAgent } from './agents/strategy';
import { ResearchAgent } from './agents/research';
import { CompanyIntelAgent } from './agents/company-intel';
import { CompetitorIntelAgent } from './agents/competitor-intel';
import { SeoAgent } from './agents/seo';
import { ContentAgent } from './agents/content';
import { MediaAgent } from './agents/media';
import { SocialAgent } from './agents/social';
import { CommunityAgent } from './agents/community';
import { LeadAgent } from './agents/lead';
import { AnalyticsAgent } from './agents/analytics';
import { LearningAgent } from './agents/learning';

export const ALL_SPECIALIZED_AGENTS: AgentDefinition[] = [
  ExecutiveAgent,
  StrategyAgent,
  ResearchAgent,
  CompanyIntelAgent,
  CompetitorIntelAgent,
  SeoAgent,
  ContentAgent,
  MediaAgent,
  SocialAgent,
  CommunityAgent,
  LeadAgent,
  AnalyticsAgent,
  LearningAgent,
];

export function getAgentBySlug(slug: string): AgentDefinition | undefined {
  return ALL_SPECIALIZED_AGENTS.find((a) => a.slug === slug);
}

export function getAgentsByRole(role: AgentRole): AgentDefinition[] {
  return ALL_SPECIALIZED_AGENTS.filter((a) => a.role === role);
}
