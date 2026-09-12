# GrowthOS — Security

## Authentication
- JWT access tokens (15min TTL) + refresh tokens (30d) in httpOnly Secure cookies
- Passwords hashed with bcrypt (cost 12)
- PKCE for OAuth flows
- Rate limiting on auth endpoints: 5 req/min per IP on login/register

## Authorization
- RBAC: owner > admin > manager > member > viewer
- Every NestJS controller guard validates JWT + extracts org context from token
- Tenant ID ALWAYS derived from authenticated session, never trusted from request body/params
- organizationId injected into every Prisma query via service layer

## Secret Management
- Application secrets via environment variables (never committed)
- OAuth tokens encrypted at rest: AES-256-GCM with key from ENCRYPTION_KEY env var
- Encrypted credentials stored as `{ iv, ciphertext, tag }` JSON in `oauth_credentials` table
- Secrets never logged, never sent to LLMs, never returned by API endpoints
- .env.example documents all required vars with safe placeholder values

## SSRF Protection
All user-provided URLs go through `safeUrlFetch()` in packages/shared:
- Parse URL
- Resolve to IP
- Reject if IP is in: 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
- Reject metadata endpoints: 169.254.169.254, etc.
- Configurable allowlist for trusted domains

## Input Validation
- All API inputs validated via class-validator decorators
- File uploads: MIME type check + size limit (configurable, default 10MB)
- URL inputs: SSRF-safe parsing before any fetch
- SQL injection: prevented by Prisma parameterized queries

## Webhook Security
- Verify HMAC-SHA256 signature on all incoming webhooks
- Reject requests older than 5 minutes (timestamp check)
- Store processed webhook IDs for replay protection (24h window, Redis)

## Audit Logging
All sensitive actions written to `audit_logs` table (append-only):
- login, logout, failed_login
- connector_added, connector_removed
- permission_changed, role_changed
- agent_executed, content_published, message_sent
- approval_granted, approval_rejected
- settings_changed, billing_changed
- team_member_added, team_member_removed

## Rate Limiting
- Global: 1000 req/15min per IP (NestJS Throttler)
- Auth endpoints: 5 req/min per IP
- AI-intensive endpoints: 60 req/hour per user
- Connector endpoints: per-platform rate limits respected

## Security Headers
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy
