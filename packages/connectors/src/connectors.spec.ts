import { describe, it, expect } from 'vitest';
import {
  defaultConnectorRegistry,
  XConnector,
  LinkedInConnector,
  RedditConnector,
  SearchConsoleConnector,
  ConnectorError,
} from './index';

describe('@growthos/connectors', () => {
  it('registers all standard growth connector adapters', () => {
    const list = defaultConnectorRegistry.list();
    expect(list.length).toBeGreaterThanOrEqual(6);
    expect(defaultConnectorRegistry.get('twitter')).toBeInstanceOf(XConnector);
    expect(defaultConnectorRegistry.get('linkedin')).toBeInstanceOf(LinkedInConnector);
    expect(defaultConnectorRegistry.get('reddit')).toBeInstanceOf(RedditConnector);
    expect(defaultConnectorRegistry.get('google_search_console')).toBeInstanceOf(
      SearchConsoleConnector,
    );
  });

  it('XConnector publishes posts and returns external status URLs', async () => {
    const x = new XConnector();
    const auth = await x.authenticate({ apiKey: 'test_key', apiSecret: 'test_secret' });
    expect(auth.success).toBe(true);

    const result = await x.execute(
      'publish_post',
      { text: 'Announcing GrowthOS v1.0!' },
      { apiKey: 'test_key', apiSecret: 'test_secret' },
    );

    expect(result.success).toBe(true);
    expect(result.externalUrl).toContain('x.com');
  });

  it('throws ConnectorError when an unsupported capability is requested', async () => {
    const li = new LinkedInConnector();
    await expect(
      li.execute('dm' as any, {}, { clientId: 'c1', clientSecret: 's1' }),
    ).rejects.toThrow(ConnectorError);
  });

  it('executes Search Console analytics queries successfully', async () => {
    const gsc = new SearchConsoleConnector();
    const result = await gsc.execute(
      'analytics',
      {},
      { clientEmail: 'sa@gsc.iam.gserviceaccount.com', privateKey: 'pk' },
    );

    expect(result.success).toBe(true);
    expect(result.data?.clicks).toBeGreaterThan(0);
    expect(result.data?.topKeywords.length).toBeGreaterThanOrEqual(3);
  });
});
