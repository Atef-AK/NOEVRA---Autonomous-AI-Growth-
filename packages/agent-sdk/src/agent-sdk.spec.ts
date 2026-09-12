import { describe, it, expect } from 'vitest';
import {
  defineAgent,
  ALL_SPECIALIZED_AGENTS,
  getAgentBySlug,
  getAgentsByRole,
} from './index';

describe('@growthos/agent-sdk', () => {
  it('registers exactly 13 specialized growth agents as specified in docs/AGENTS.md', () => {
    expect(ALL_SPECIALIZED_AGENTS.length).toBe(13);
  });

  it('retrieves agents by slug and role accurately', () => {
    const seo = getAgentBySlug('seo-agent');
    expect(seo).toBeDefined();
    expect(seo?.role).toBe('seo');
    expect(seo?.name).toBe('Technical SEO Agent');

    const execs = getAgentsByRole('executive');
    expect(execs.length).toBe(1);
    expect(execs[0]?.slug).toBe('executive-agent');
  });

  it('validates agent configurations and enforces minimum system prompt length', () => {
    expect(() =>
      defineAgent({
        name: 'Invalid Agent',
        slug: 'invalid',
        role: 'seo',
        description: 'Short desc',
        systemPrompt: 'Too short',
        preferredModel: 'gpt-4o',
        allowedTools: [],
        maxSteps: 5,
        maxTokens: 1000,
        temperatureX10: 5,
        defaultAutonomyLevel: 2,
        memoryNamespace: 'test',
      }),
    ).toThrow();
  });
});
