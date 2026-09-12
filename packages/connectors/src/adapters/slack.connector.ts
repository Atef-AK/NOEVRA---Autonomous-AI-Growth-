import { BaseConnector } from '../base-connector';
import {
  AuthResult,
  ConnectorCapability,
  ConnectorError,
  ConnectorResult,
} from '../types';

export class SlackConnector extends BaseConnector {
  readonly id = 'slack';
  readonly name = 'Slack Webhook & Web API';

  capabilities(): ConnectorCapability[] {
    return ['publish_post', 'reply'];
  }

  async authenticate(credentials: Record<string, string>): Promise<AuthResult> {
    if (!credentials['webhookUrl'] && !credentials['botToken']) {
      return {
        success: false,
        accessToken: '',
        error: 'Missing webhookUrl or botToken in Slack credentials',
      };
    }
    return {
      success: true,
      accessToken: credentials['botToken'] || 'tok_slack_webhook',
      accountId: credentials['channel'] || '#growth-alerts',
      accountName: credentials['teamName'] || 'GrowthOS Slack',
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
        `SlackConnector does not support capability: ${capability}`,
      );
    }

    return this.executeWithRetry(async () => {
      const msgId = `msg_${Date.now()}`;
      return {
        success: true,
        externalId: msgId,
        data: {
          channel: params['channel'] || '#growth-alerts',
          delivered: true,
          timestamp: new Date().toISOString(),
        } as any,
      };
    });
  }
}
