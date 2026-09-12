# GrowthOS — Connector Architecture

## Base Interface
```typescript
interface Connector {
  id: string
  name: string
  capabilities(): ConnectorCapability[]
  authenticate(params): Promise<AuthResult>
  refreshAuthentication(credentials): Promise<Credentials>
  execute(capability, params): Promise<ConnectorResult>
  healthCheck(): Promise<HealthResult>
}
```

## Capability Declaration
Connectors MUST explicitly declare capabilities. Never assume a platform supports an operation.
```typescript
type ConnectorCapability =
  | 'publish_post' | 'schedule_post' | 'read_posts' | 'read_comments'
  | 'reply' | 'analytics' | 'media_upload' | 'dm'
```

## Planned Connectors
- XConnector (Twitter/X API v2)
- LinkedInConnector
- FacebookConnector
- InstagramConnector
- YouTubeConnector (read + analytics)
- TikTokConnector
- RedditConnector
- GoogleAnalyticsConnector
- SearchConsoleConnector
- EmailConnector (SMTP / SendGrid / Resend)
- CRMConnector (HubSpot / Salesforce)
- WebsiteConnector (read + sitemap)

## Security Rules
- OAuth tokens encrypted at rest (AES-256-GCM)
- Refresh tokens never sent to LLMs
- Connector credentials never returned by API
- Platform API rules respected (no CAPTCHA bypass, no rate-limit circumvention)
- Capabilities verified against current official API documentation before implementation

## Error Handling
Every connector handles: timeout, 429 (rate limit), 401 (auth), 403, 404, 5xx, network error,
invalid payload, expired token, quota exceeded.
Implements: retry with exponential backoff, dead-letter queue, idempotency.
