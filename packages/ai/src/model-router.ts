/**
 * ModelRouter — selects the right provider for a given "provider/model" string,
 * handles fallback chains, and retries on transient errors.
 *
 * Usage:
 *   const router = new ModelRouter(config);
 *   const response = await router.complete('openai/gpt-4o', { messages: [...] });
 */
import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  ModelRouterConfig,
  ProviderName,
} from './types';

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: {
    retries: number;
    minTimeout: number;
    factor: number;
    shouldRetry: (err: unknown) => boolean;
    onFailedAttempt?: (err: unknown) => void;
  },
): Promise<T> {
  let attempt = 0;
  let delay = opts.minTimeout;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > opts.retries || !opts.shouldRetry(err)) {
        throw err;
      }
      opts.onFailedAttempt?.(err);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= opts.factor;
    }
  }
}

/** Errors that should NOT be retried (auth, quota) */
const PERMANENT_ERROR_CODES = new Set([401, 403, 404, 422]);

function isTransientError(err: unknown): boolean {
  if (err instanceof Error) {
    if (err.message.includes('not configured')) {
      return false;
    }
    if ('status' in err) {
      const status = (err as { status: number }).status;
      return !PERMANENT_ERROR_CODES.has(status);
    }
  }
  return true; // assume transient if we don't know
}

export class ModelRouter {
  private readonly providers: Partial<Record<ProviderName, AIProvider>>;
  private readonly defaultProvider: ProviderName;
  private readonly fallbackChain: ProviderName[];

  constructor(config: ModelRouterConfig) {
    this.providers = config.providers;
    this.defaultProvider = config.defaultProvider;
    this.fallbackChain = config.fallbackChain ?? [];
  }

  /**
   * Parse "provider/model" or "model" into { providerName, model }
   */
  private parseModel(providerModel: string): { providerName: ProviderName; model: string } {
    // If the default provider is an aggregator, it expects the full string (e.g. google/gemini-2.5-flash)
    if (['openrouter', 'opencode', 'orcarouter'].includes(this.defaultProvider)) {
      return { providerName: this.defaultProvider, model: providerModel };
    }

    const parts = providerModel.split('/');
    if (parts.length >= 2) {
      const providerName = parts[0] as ProviderName;
      const model = parts.slice(1).join('/');
      return { providerName, model };
    }
    // No provider prefix — use default
    return { providerName: this.defaultProvider, model: providerModel };
  }

  private getProvider(name: ProviderName): AIProvider {
    const provider = this.providers[name];
    if (!provider) {
      throw new Error(
        `AI provider "${name}" is not configured. ` +
        `Add the API key to your .env and enable it in ModelRouter config.`,
      );
    }
    return provider;
  }

  async complete(
    providerModel: string,
    request: CompletionRequest,
  ): Promise<CompletionResponse> {
    const { providerName, model } = this.parseModel(providerModel);

    // Try primary provider with retries
    try {
      return await this.completeWithRetry(providerName, model, request);
    } catch (primaryErr) {
      if (!isTransientError(primaryErr) || this.fallbackChain.length === 0) {
        throw primaryErr;
      }

      // Try fallback chain
      for (const fallbackName of this.fallbackChain) {
        if (fallbackName === providerName) continue;
        const fallbackProvider = this.providers[fallbackName];
        if (!fallbackProvider) continue;
        try {
          return await this.completeWithRetry(
            fallbackName,
            fallbackProvider.defaultModel,
            request,
          );
        } catch {
          continue; // try next fallback
        }
      }

      throw primaryErr; // all fallbacks exhausted
    }
  }

  private completeWithRetry(
    providerName: ProviderName,
    model: string,
    request: CompletionRequest,
  ): Promise<CompletionResponse> {
    const provider = this.getProvider(providerName);

    return retryWithBackoff(
      () => provider.complete(model, request),
      {
        retries: 2,
        minTimeout: 1000,
        factor: 2,
        shouldRetry: (err) => isTransientError(err),
        onFailedAttempt: (err: any) => {
          console.warn(
            `[ModelRouter] ${providerName}/${model} attempt failed: ${err?.message ?? err}`,
          );
        },
      },
    );
  }

  /** Returns true if a given provider is configured */
  hasProvider(name: ProviderName): boolean {
    return !!this.providers[name];
  }

  /** List configured providers */
  configuredProviders(): ProviderName[] {
    return (Object.keys(this.providers) as ProviderName[]).filter(p => !!this.providers[p]);
  }
}
