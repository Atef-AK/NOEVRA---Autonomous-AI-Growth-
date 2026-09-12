# NOEVRA — GrowthOS
## Autonomous AI Growth Operating System — Master Engineering & Product Build Specification

> The full specification prompt is preserved below verbatim as committed by the build engineer.

## Product Vision
GrowthOS is an AI-powered Growth Operating System for startups and digital businesses.
Customers connect their company, goals, and integrations. GrowthOS operates a continuous
AI-driven growth department: research, strategy, content, social, SEO, community, leads,
analytics, learning, and execution — all within configurable autonomy levels.

## Fundamental Loop
OBSERVE → UNDERSTAND → RESEARCH → PLAN → EXECUTE → MEASURE → LEARN → ADAPT → EXECUTE AGAIN

## Core Principle
The moat is NOT the LLM. The moat is:
  Company Intelligence + Marketing Memory + Cross-channel Intelligence + Experiments +
  Attribution + Agent Orchestration + Tools + Connectors + Learning + Execution History

## Technology Stack
- Frontend: Next.js 14+, React 18+, TypeScript 5+, Tailwind CSS, shadcn/ui, TanStack Query, Zustand
- Backend: NestJS, TypeScript 5+, REST + WebSocket/SSE, Prisma, PostgreSQL 16 + pgvector
- Jobs: Redis 7+, BullMQ
- Storage: S3-compatible (Cloudflare R2 / MinIO for dev)
- AI: Multi-provider abstraction (OpenAI, Anthropic, Gemini, Local)

## Development Phases
1. Foundation — Monorepo, Auth, RBAC, Multi-tenancy
2. AI Runtime — AIProvider, Router, Agent Runtime, SDK, Tools
3. Company Brain — Crawler, Embeddings, Knowledge, Memory
4. Strategy — Executive/Strategy/Research Agents, Goals, Missions
5. Content — Content Agent, Factory, Calendar, Media Pipeline
6. Connectors — OAuth, Social/Analytics connectors
7. SEO — Technical audit, keywords, content gaps
8. Community + Leads — Discovery, scoring, pipeline
9. Analytics + Learning — Attribution, Experiments, Learning Engine
10. Autonomous Loop — Full Growth Loop, Scheduler, Event Bus

## Security Requirements (non-negotiable)
- JWT auth + httpOnly cookies
- RBAC: owner/admin/manager/member/viewer
- Tenant isolation: every query scoped, never trust client tenant IDs
- SSRF protection on all URL inputs
- OAuth tokens encrypted at rest (AES-256-GCM)
- Secrets never in logs, never in LLM context, never in frontend
- Audit logs for all sensitive actions
- Rate limiting at IP/user/org/project levels

## Autonomy Levels
1. Copilot — AI recommends, human executes
2. Assisted — AI prepares, human approves all
3. Supervised — AI executes low-risk, important needs approval
4. Autonomous — AI executes within strict policies
5. Autonomous Growth — AI continuously operates within user-defined limits

## Ethics Hard Stops (NEVER implement)
- Fake accounts, identities, engagement, reviews
- Mass unsolicited spam
- CAPTCHA bypass or rate-limit circumvention via automation abuse
- Browser automation to circumvent platform API restrictions
- Irrelevant promotional content for backlink farming
- Human impersonation, automated harassment

## Definition of Done
A phase is complete ONLY when:
- All acceptance criteria tests pass
- TypeScript compiles (strict mode, zero errors)
- ESLint: zero errors
- Unit + integration tests pass
- No fake/mock implementations in production code paths
- Phase is git-committed

For full specification details see docs/ARCHITECTURE.md, docs/IMPLEMENTATION_PLAN.md,
docs/DATABASE.md, docs/AGENTS.md, docs/CONNECTORS.md, docs/SECURITY.md, docs/DEPLOYMENT.md
