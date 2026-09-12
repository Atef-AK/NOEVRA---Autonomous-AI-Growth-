import {
  Connector,
  ConnectorCapability,
  ConnectorError,
  ConnectorResult,
  AuthResult,
  HealthResult,
} from './types';

export abstract class BaseConnector implements Connector {
  abstract id: string;
  abstract name: string;

  abstract capabilities(): ConnectorCapability[];

  hasCapability(cap: ConnectorCapability): boolean {
    return this.capabilities().includes(cap);
  }

  abstract authenticate(credentials: Record<string, string>): Promise<AuthResult>;

  abstract refreshAuthentication(
    credentials: Record<string, string>,
  ): Promise<Record<string, string>>;

  abstract execute<T = any>(
    capability: ConnectorCapability,
    params: Record<string, any>,
    credentials: Record<string, string>,
  ): Promise<ConnectorResult<T>>;

  async healthCheck(credentials: Record<string, string>): Promise<HealthResult> {
    const start = Date.now();
    try {
      const auth = await this.authenticate(credentials);
      return {
        healthy: auth.success,
        latencyMs: Date.now() - start,
        error: auth.error,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: (err as Error).message,
      };
    }
  }

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    initialDelayMs = 200,
  ): Promise<T> {
    let attempt = 0;
    let delay = initialDelayMs;

    while (true) {
      try {
        return await operation();
      } catch (err: any) {
        attempt++;
        const isRateLimited = err?.statusCode === 429 || err?.code === 'RATE_LIMITED';
        const isTransient = err?.statusCode >= 500 || err?.code === 'UPSTREAM_ERROR';

        if ((isRateLimited || isTransient) && attempt <= maxRetries) {
          const waitTime = err?.retryAfterMs ?? delay;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          delay *= 2;
          continue;
        }

        throw err;
      }
    }
  }
}
