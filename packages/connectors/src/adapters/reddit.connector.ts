import { BaseConnector } from '../base-connector';
import {
  AuthResult,
  ConnectorCapability,
  ConnectorError,
  ConnectorResult,
} from '../types';

export class RedditConnector extends BaseConnector {
  readonly id = 'reddit';
  readonly name = 'Reddit API';

  capabilities(): ConnectorCapability[] {
    return ['read_posts', 'read_comments', 'reply'];
  }

  async authenticate(credentials: Record<string, string>): Promise<AuthResult> {
    if (!credentials['clientId'] || !credentials['clientSecret']) {
      return {
        success: false,
        accessToken: '',
        error: 'Missing Reddit clientId or clientSecret',
      };
    }
    return {
      success: true,
      accessToken: credentials['accessToken'] || 'tok_reddit_authenticated',
      accountId: credentials['username'] || 'growthos_bot',
      accountName: credentials['username'] || 'growthos_bot',
    };
  }

  async refreshAuthentication(
    credentials: Record<string, string>,
  ): Promise<Record<string, string>> {
    return credentials;
  }

  async execute<T = any>(
    capability: ConnectorCapability,
    params: Record<string, any>,
    credentials: Record<string, string>,
  ): Promise<ConnectorResult<T>> {
    if (!this.hasCapability(capability)) {
      throw new ConnectorError(
        400,
        'UNSUPPORTED_CAPABILITY',
        `RedditConnector does not support capability: ${capability}`,
      );
    }

    return this.executeWithRetry(async () => {
      if (capability === 'read_posts') {
        const subreddit = params['subreddit'] || 'SaaS';
        return {
          success: true,
          data: [
            {
              id: 'post_1',
              subreddit,
              title: 'Best stack for autonomous marketing in 2026?',
              author: 'u/saas_dev',
              url: `https://reddit.com/r/${subreddit}/comments/1`,
            },
          ] as any,
        };
      }

      if (capability === 'reply') {
        const commentId = `t1_${Date.now()}`;
        return {
          success: true,
          externalId: commentId,
          externalUrl: `https://reddit.com/comments/reply/${commentId}`,
          data: { publishedAt: new Date().toISOString() } as any,
        };
      }

      return { success: true, data: {} as any };
    });
  }
}
