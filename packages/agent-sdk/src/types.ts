import { z } from 'zod';

export type AgentRole =
  | 'executive'
  | 'strategy'
  | 'research'
  | 'company_intel'
  | 'competitor_intel'
  | 'seo'
  | 'content'
  | 'media'
  | 'social'
  | 'community'
  | 'lead'
  | 'analytics'
  | 'learning';

export interface AgentDefinition {
  name: string;
  slug: string;
  role: AgentRole;
  description: string;
  systemPrompt: string;
  preferredModel: string;
  allowedTools: string[];
  maxSteps: number;
  maxTokens: number;
  temperatureX10: number; // 0 - 20 (scaled for integers)
  defaultAutonomyLevel: number; // 1 - 5
  memoryNamespace: string;
}

export const AgentDefinitionSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  role: z.enum([
    'executive',
    'strategy',
    'research',
    'company_intel',
    'competitor_intel',
    'seo',
    'content',
    'media',
    'social',
    'community',
    'lead',
    'analytics',
    'learning',
  ]),
  description: z.string().min(10),
  systemPrompt: z.string().min(50),
  preferredModel: z.string().default('openai/gpt-4o'),
  allowedTools: z.array(z.string()),
  maxSteps: z.number().int().min(1).max(30).default(10),
  maxTokens: z.number().int().min(100).max(16000).default(4000),
  temperatureX10: z.number().int().min(0).max(20).default(7),
  defaultAutonomyLevel: z.number().int().min(1).max(5).default(2),
  memoryNamespace: z.string(),
});
