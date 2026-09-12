# GrowthOS — Deployment

## Target Architecture
```
Cloudflare (DNS + CDN)
  ↓
Reverse Proxy (Nginx / Caddy)
  ↓
Web (Next.js)    API (NestJS)    Worker (BullMQ)
  ↓
PostgreSQL 16 + pgvector
  ↓
Redis 7
  ↓
S3-Compatible Object Storage (R2)
```

## Environment Variables
See `.env.example` for all required variables.
Critical: DATABASE_URL, REDIS_URL, JWT_SECRET, ENCRYPTION_KEY, AI provider keys.

## Development
```bash
docker compose -f infra/docker/docker-compose.yml up -d  # postgres + redis
pnpm install
pnpm db:migrate
pnpm dev  # starts all apps via turborepo
```

## Production
- Build: `pnpm build`
- Migrate: `pnpm db:migrate:prod`
- Start: `pnpm start`
- Docker: `docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.prod.yml up -d`

## VPS Setup
Initial deployment targets a single VPS (4+ CPU, 8GB+ RAM, SSD).
Kubernetes not required until scale demands it.
