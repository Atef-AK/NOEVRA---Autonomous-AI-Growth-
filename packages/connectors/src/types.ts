export type ConnectorCapability =
  | 'publish_post'
  | 'schedule_post'
  | 'read_posts'
  | 'read_comments'
  | 'reply'
  | 'analytics'
  | 'media_upload'
  | 'dm';

export interface AuthResult {
  success: boolean;
  accessToken: string;
  refreshToken?: string | undefined;
  expiresIn?: number | undefined;
  accountId?: string | undefined;
  accountName?: string | undefined;
  error?: string | undefined;
}

export interface ConnectorResult<T = any> {
  success: boolean;
  data?: T | undefined;
  externalId?: string | undefined;
  externalUrl?: string | undefined;
  error?: string | undefined;
}

export interface HealthResult {
  healthy: boolean;
  latencyMs: number;
  error?: string | undefined;
}

export class ConnectorError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code:
      | 'RATE_LIMITED'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'QUOTA_EXCEEDED'
      | 'NETWORK_ERROR'
      | 'UPSTREAM_ERROR'
      | 'UNSUPPORTED_CAPABILITY',
    message: string,
    public readonly retryAfterMs?: number | undefined,
  ) {
    super(message);
    this.name = 'ConnectorError';
  }
}

export interface Connector {
  id: string;
  name: string;
  capabilities(): ConnectorCapability[];
  hasCapability(cap: ConnectorCapability): boolean;
  authenticate(credentials: Record<string, string>): Promise<AuthResult>;
  refreshAuthentication(credentials: Record<string, string>): Promise<Record<string, string>>;
  execute<T = any>(
    capability: ConnectorCapability,
    params: Record<string, any>,
    credentials: Record<string, string>,
  ): Promise<ConnectorResult<T>>;
  healthCheck(credentials: Record<string, string>): Promise<HealthResult>;
}
