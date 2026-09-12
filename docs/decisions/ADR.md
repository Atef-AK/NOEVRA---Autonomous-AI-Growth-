# GrowthOS — Architecture Decision Records

## ADR-001: Monorepo with Turborepo
**Date:** 2026-09-12
**Status:** Accepted
**Context:** Need shared packages (types, database, AI abstraction) across apps/web, apps/api, apps/worker.
**Decision:** Use Turborepo + pnpm workspaces for the monorepo.
**Consequences:** Fast incremental builds, easy package sharing, single version lock.

## ADR-002: Prisma as sole ORM
**Date:** 2026-09-12
**Status:** Accepted
**Context:** Need type-safe database access, migrations, and pgvector support.
**Decision:** Prisma ORM for all relational queries. Raw SQL via `$queryRaw` only for pgvector similarity searches.
**Consequences:** Single migration workflow, consistent tenant scoping pattern.

## ADR-003: Multi-tenancy via organizationId column (row-level)
**Date:** 2026-09-12
**Status:** Accepted
**Context:** Must isolate tenant data. Full database-per-tenant is too expensive at startup scale.
**Decision:** Every tenant-scoped table has `organizationId` FK. All queries MUST include it. Verified by integration tests.
**Consequences:** Simple deployment, but requires discipline. Test coverage is mandatory.

## ADR-004: AIProvider interface — never import provider SDK in app code
**Date:** 2026-09-12
**Status:** Accepted
**Context:** Avoid lock-in to OpenAI or any single provider.
**Decision:** All AI calls go through `packages/ai` AIProvider interface. Application code uses `AIModelRouter`, not raw SDK.
**Consequences:** Easy to swap or add providers. Costs and latency tracked uniformly.

## ADR-005: Tools as sole LLM ↔ Infrastructure interface
**Date:** 2026-09-12
**Status:** Accepted
**Context:** LLMs must not directly run SQL, receive secrets, or execute arbitrary code.
**Decision:** LLMs can only interact with infrastructure via registered tools with schema validation and permission checks.
**Consequences:** Auditable, controllable, testable agent actions.

## ADR-006: Policy Engine is deterministic software
**Date:** 2026-09-12
**Status:** Accepted
**Context:** Authorization decisions must be reliable and auditable.
**Decision:** `packages/policy-engine` evaluates permissions via rule tables in database, not via LLM reasoning.
**Consequences:** Predictable, testable, auditable authorization.

## ADR-007: BullMQ for all async work
**Date:** 2026-09-12
**Status:** Accepted
**Context:** AI calls, crawls, media generation are expensive/slow and must not block HTTP.
**Decision:** All long-running work goes to BullMQ queues processed by apps/worker.
**Consequences:** Reliable job processing, retries, dead-letter queues, visibility.

## ADR-008: pnpm as package manager
**Date:** 2026-09-12
**Status:** Accepted
**Context:** Need efficient disk usage and strict dependency isolation in monorepo.
**Decision:** pnpm with workspaces.
**Consequences:** Faster installs, phantom dependency prevention.
