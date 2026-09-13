/**
 * Factory to create a ModelRouter from environment variables.
 * Only providers with API keys set will be wired up.
 */
import { ModelRouter } from './model-router';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleProvider } from './providers/google.provider';
import type { ModelRouterConfig, ProviderName } from './types';

export interface AIEnvConfig {
  OPENAI_API_KEY?: string | undefined;
  OPENAI_BASE_URL?: string | undefined;
  OPENROUTER_API_KEY?: string | undefined;
  ANTHROPIC_API_KEY?: string | undefined;
  GOOGLE_AI_API_KEY?: string | undefined;
  /** Override default provider */
  AI_DEFAULT_PROVIDER?: string | undefined;
}

export function createModelRouter(env: AIEnvConfig): ModelRouter {
  const providers: ModelRouterConfig['providers'] = {};

  if (env.OPENAI_API_KEY) {
    providers.openai = new OpenAIProvider(env.OPENAI_API_KEY, env.OPENAI_BASE_URL);
  }
  if (env.OPENROUTER_API_KEY) {
    // OpenRouter uses the exact same interface as OpenAI
    providers.openrouter = new OpenAIProvider(env.OPENROUTER_API_KEY, 'https://openrouter.ai/api/v1');
  }
  if (env.ANTHROPIC_API_KEY) {
    providers.anthropic = new AnthropicProvider(env.ANTHROPIC_API_KEY);
  }
  if (env.GOOGLE_AI_API_KEY) {
    providers.google = new GoogleProvider(env.GOOGLE_AI_API_KEY);
  }

  // Determine default: use configured env, then preference order (Gemini first)
  const preferenceOrder: ProviderName[] = ['google', 'openai', 'anthropic'];
  const envDefault = env.AI_DEFAULT_PROVIDER as ProviderName | undefined;

  const defaultProvider: ProviderName =
    (envDefault && providers[envDefault] ? envDefault : null) ??
    preferenceOrder.find(p => !!providers[p]) ??
    'openai'; // will throw at call-time if no provider is configured

  const fallbackChain = preferenceOrder.filter(
    p => p !== defaultProvider && !!providers[p],
  );

  return new ModelRouter({ providers, defaultProvider, fallbackChain });
}

export { ModelRouter } from './model-router';
export { OpenAIProvider } from './providers/openai.provider';
export { AnthropicProvider } from './providers/anthropic.provider';
export { GoogleProvider } from './providers/google.provider';
export * from './types';
