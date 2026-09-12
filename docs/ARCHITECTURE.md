# GrowthOS — Architecture

## Overview
GrowthOS is a multi-tenant AI Growth Operating System built as a monorepo SaaS platform.

## Monorepo Layout
```
apps/
  web/        Next.js 14 frontend (App Router)
  api/        NestJS REST + WebSocket API
  worker/     BullMQ job processor

packages/
  ai/             AIProvider abstraction + AIModelRouter
  agent-runtime/  Agent execution engine
  agent-sdk/      defineAgent() helper
  tools/          Tool registry + implementations
  connectors/     Connector SDK + platform adapters
  memory/         Memory store + retrieval (pgvector)
  policy-engine/  Permission + policy evaluation
  database/       Prisma schema, client, migrations
  events/         Internal event bus (EventEmitter2 / Redis pub/sub)
  analytics/      Analytics pipeline
  billing/        Usage ledger + plan engine
  shared/         Types, utils, constants
  ui/             Shared React design system (shadcn/ui based)
  config/         Zod-validated env/app configuration schemas

infra/
  docker/         Dockerfiles + compose files
  scripts/        DB seed, migration helpers
```

## Request Flow
```
Browser → Next.js (Edge/SSR) → NestJS API → Services → Prisma → PostgreSQL
                                          ↘ BullMQ → Worker → AI/Connectors
                                          ↘ Redis (cache)
                                          ↘ R2 (object storage)
```

## Agent Execution Flow
```
HTTP/Event trigger
  → Agent Runtime
    → Load CompanyBrain context
    → Load relevant Memory (pgvector similarity)
    → Determine permissions (PolicyEngine)
    → LLM planning call (AIModelRouter)
    → Tool calls (ToolRegistry)
      → Permission check
      → Execute
      → Validate result
    → Continue or stop
    → Store execution (PostgreSQL)
    → Extract + store memory
    → Emit events
```

## AI Provider Abstraction
All AI calls go through `packages/ai`.
Never import OpenAI/Anthropic/Gemini SDKs directly in application code.
```typescript
interface AIProvider {
  generateText(params): Promise<TextResult>
  generateStructured<T>(params, schema: ZodSchema<T>): Promise<T>
  generateEmbedding(params): Promise<EmbeddingResult>
  stream(params): AsyncIterable<StreamChunk>
  estimateCost(params): CostEstimate
}
```

## Memory Architecture
- Storage: PostgreSQL + pgvector (1536-dim embeddings)
- Types: semantic, episodic, procedural, strategic, customer, campaign, content, experiment, brand
- Retrieval: hybrid (vector similarity + keyword + metadata filter + recency/importance weighting)
- Never inject full history into prompts — contextual retrieval only

## Security Architecture
- Auth: Passport.js (JWT strategy) + httpOnly refresh cookies
- Tenant isolation: every Prisma query includes `organizationId` where clause
- SSRF: URL allowlist + private IP blocklist on all crawler/fetch operations
- Secrets: encrypted with AES-256-GCM, key from env (KMS in production)
- Audit: write-only audit_logs table on all sensitive mutations

## Event Bus
Internal events (TypeScript EventEmitter2) for in-process.
Redis pub/sub for cross-process (api ↔ worker).
All events typed as `SystemEvent` discriminated union.

## Queue Architecture (BullMQ)
Queues: research, crawl, embedding, content_generation, media_generation,
        social_publish, community_monitoring, lead_scoring, analytics_sync,
        seo_analysis, experiment_execution, agent_execution,
        scheduled_jobs, webhooks, notifications

## Key Design Decisions
- Prisma as single ORM (no mixing with raw queries except for pgvector operations)
- NestJS modules map 1:1 to bounded contexts
- Tools are the only interface between LLMs and infrastructure
- Policy Engine is deterministic software, not LLM-based
- Billing calculations are deterministic, not LLM-based
- Authentication/authorization is deterministic, not LLM-based
