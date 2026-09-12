# GrowthOS — Autonomous AI Growth Operating System

> **Status: Phase 1 — Foundation (in progress)**

GrowthOS is a production-grade, multi-tenant AI SaaS platform that operates as an
autonomous digital growth department for startups and digital businesses.

## What it does
- Crawls your website and builds a **Company Brain** — an evolving intelligence profile
- Operates an AI growth team: Research, Strategy, Content, Social, SEO, Community, Leads, Analytics
- Executes growth actions within configurable **autonomy levels** (Copilot → Autonomous Growth)
- Learns from every experiment and continuously improves strategy

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui |
| API | NestJS, TypeScript, REST + WebSocket |
| Database | PostgreSQL 16 + pgvector, Prisma |
| Jobs | Redis, BullMQ |
| Storage | S3-compatible (Cloudflare R2) |
| AI | Multi-provider: OpenAI, Anthropic, Gemini (abstracted) |
| Monorepo | Turborepo + pnpm workspaces |

## Quick Start (Development)

```bash
# Prerequisites: Docker Desktop, Node 22+, pnpm

# Install dependencies
pnpm install

# Start infrastructure
docker compose -f infra/docker/docker-compose.yml up -d

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
pnpm db:migrate

# Start all apps in dev mode
pnpm dev
```

## Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Database Schema](docs/DATABASE.md)
- [Agents](docs/AGENTS.md)
- [Connectors](docs/CONNECTORS.md)
- [Security](docs/SECURITY.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Architecture Decisions](docs/decisions/ADR.md)
- [Full Specification](docs/SPEC.md)

## Development Phases
1. ✅ Foundation — Auth, RBAC, Multi-tenancy *(current)*
2. ⬜ AI Runtime — Agent Runtime, Tools, Cost tracking
3. ⬜ Company Brain — Crawler, Embeddings, Memory
4. ⬜ Strategy — Executive/Strategy/Research Agents
5. ⬜ Content — Content Factory, Calendar, Media
6. ⬜ Connectors — OAuth, Social/Analytics
7. ⬜ SEO — Technical audit, Keywords
8. ⬜ Community + Leads — Discovery, Scoring
9. ⬜ Analytics + Learning — Attribution, Experiments
10. ⬜ Autonomous Growth Loop

## Security
See [SECURITY.md](docs/SECURITY.md) for full security architecture.
Never commit real secrets. Use `.env` (gitignored) for local development.
