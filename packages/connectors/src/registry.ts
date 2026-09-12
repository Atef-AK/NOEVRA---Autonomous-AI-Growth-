import { Connector } from './types';
import { XConnector } from './adapters/x.connector';
import { LinkedInConnector } from './adapters/linkedin.connector';
import { RedditConnector } from './adapters/reddit.connector';
import { SlackConnector } from './adapters/slack.connector';
import { WebhookConnector } from './adapters/webhook.connector';
import { SearchConsoleConnector } from './adapters/search-console.connector';

export class ConnectorRegistry {
  private readonly connectors = new Map<string, Connector>();

  constructor() {
    this.register(new XConnector());
    this.register(new LinkedInConnector());
    this.register(new RedditConnector());
    this.register(new SlackConnector());
    this.register(new WebhookConnector());
    this.register(new SearchConsoleConnector());
  }

  register(connector: Connector): void {
    this.connectors.set(connector.id, connector);
  }

  get(id: string): Connector | undefined {
    return this.connectors.get(id);
  }

  list(): Connector[] {
    return Array.from(this.connectors.values());
  }
}

export const defaultConnectorRegistry = new ConnectorRegistry();
