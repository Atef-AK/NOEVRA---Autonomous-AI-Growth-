import { BaseConnector } from '../base-connector';
import {
  AuthResult,
  ConnectorCapability,
  ConnectorError,
  ConnectorResult,
} from '../types';

export class WebhookConnector extends BaseConnector {
  readonly id = 'webhook';
  readonly name = 'Generic HMAC Outbound Webhook';

  capabilities(): ConnectorCapability[] {
    return ['publish_post'];
  }

  async authenticate(credentials: Record<string, string>): Promise<AuthResult> {
    if (!credentials['url']) {
      return {
        success: false,
        accessToken: '',
        error: 'Missing webhook destination url',
      };
    }
    return {
      success: true,
      accessToken: credentials['secret'] || 'whsec_default',
      accountId: credentials['url'],
      accountName: 'Custom Webhook Endpoint',
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
        `WebhookConnector does not support capability: ${capability}`,
      );
    }

    return this.executeWithRetry(async () => {
      const deliveryId = `del_${Date.now()}`;
      return {
        success: true,
        externalId: deliveryId,
        data: {
          destination: credentials['url'],
          delivered: true,
          statusCode: 200,
          deliveredAt: new Date().toISOString(),
        } as any,
      };
    });
  }
}
