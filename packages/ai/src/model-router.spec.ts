/**
 * Unit tests for ModelRouter and pricing utilities.
 * These run without real API keys by using mock providers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelRouter } from './model-router';
import { estimateCost, MODEL_PRICING } from './types';
import type { AIProvider, CompletionRequest, CompletionResponse } from './types';

// ── Mock Provider ─────────────────────────────────────────────────────────────

function makeMockProvider(name: string, shouldFail = false): AIProvider {
  return {
    name,
    defaultModel: 'mock-model',
    supportedModels: ['mock-model'] as const,
    complete: vi.fn(async (_model: string, _req: CompletionRequest): Promise<CompletionResponse> => {
      if (shouldFail) {
        const err = new Error('Provider unavailable') as Error & { status: number };
        err.status = 503;
        throw err;
      }
      return {
        id: `${name}-resp-1`,
        provider: name,
        model: 'mock-model',
        text: 'Hello from ' + name,
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { inputTokens: 100, outputTokens: 50, estimatedCostUsd: 0.001 },
        latencyMs: 42,
      };
    }),
  };
}

// ── Pricing ───────────────────────────────────────────────────────────────────

describe('estimateCost', () => {
  it('returns 0 for unknown model', () => {
    expect(estimateCost('unknown/model', 1000, 500)).toBe(0);
  });

  it('correctly computes gpt-4o cost', () => {
    // 1M input @ $2.50 + 1M output @ $10.00
    const cost = estimateCost('openai/gpt-4o', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(12.5, 4);
  });

  it('correctly computes claude-3-5-sonnet cost', () => {
    // 500k input @ $3/M + 200k output @ $15/M
    const cost = estimateCost('anthropic/claude-3-5-sonnet', 500_000, 200_000);
    expect(cost).toBeCloseTo(1.5 + 3.0, 4);
  });

  it('correctly computes gemini-1.5-flash cost', () => {
    const cost = estimateCost('google/gemini-1.5-flash', 2_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.15 + 0.3, 5);
  });

  it('pricing table has entries for all 3 providers', () => {
    const keys = Object.keys(MODEL_PRICING);
    expect(keys.some(k => k.startsWith('openai/'))).toBe(true);
    expect(keys.some(k => k.startsWith('anthropic/'))).toBe(true);
    expect(keys.some(k => k.startsWith('google/'))).toBe(true);
  });
});

// ── ModelRouter ───────────────────────────────────────────────────────────────

describe('ModelRouter', () => {
  let primary: AIProvider;
  let fallback: AIProvider;
  let router: ModelRouter;

  beforeEach(() => {
    primary = makeMockProvider('openai');
    fallback = makeMockProvider('anthropic');
    router = new ModelRouter({
      defaultProvider: 'openai',
      providers: { openai: primary, anthropic: fallback },
      fallbackChain: ['anthropic'],
    });
  });

  it('routes to correct provider by prefix', async () => {
    const res = await router.complete('openai/gpt-4o', { messages: [{ role: 'user', content: 'hi' }] });
    expect(res.provider).toBe('openai');
    expect(primary.complete).toHaveBeenCalledOnce();
  });

  it('uses default provider when no prefix given', async () => {
    const res = await router.complete('gpt-4o', { messages: [{ role: 'user', content: 'hi' }] });
    expect(res.provider).toBe('openai');
  });

  it('throws for unconfigured provider', async () => {
    await expect(
      router.complete('google/gemini-1.5-pro', { messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow(/not configured/);
  });

  it('falls back to secondary provider on transient failure', async () => {
    const failingPrimary = makeMockProvider('openai', true);
    const workingFallback = makeMockProvider('anthropic', false);
    const routerWithFallback = new ModelRouter({
      defaultProvider: 'openai',
      providers: { openai: failingPrimary, anthropic: workingFallback },
      fallbackChain: ['anthropic'],
    });

    const res = await routerWithFallback.complete('openai/gpt-4o', {
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(res.provider).toBe('anthropic');
    expect(workingFallback.complete).toHaveBeenCalled();
  });

  it('lists configured providers', () => {
    const configured = router.configuredProviders();
    expect(configured).toContain('openai');
    expect(configured).toContain('anthropic');
    expect(configured).not.toContain('google');
  });

  it('hasProvider returns false for unconfigured', () => {
    expect(router.hasProvider('google')).toBe(false);
    expect(router.hasProvider('openai')).toBe(true);
  });
});
