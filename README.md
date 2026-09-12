# ⚡ GrowthOS — Autonomous AI Marketing Operating System

<div align="center">

![GrowthOS Banner](https://img.shields.io/badge/GrowthOS-Autonomous_AI_Marketing_OS-6366f1?style=for-the-badge&logo=openai&logoColor=white)

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS_10-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ_Redis-CC0000?style=flat-square&logo=redis&logoColor=white)](https://bullmq.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**Enter your website. GrowthOS handles the rest.**  
A production-ready, multi-tenant AI SaaS platform that operates as a 24/7 autonomous marketing department for startups, scaleups, and digital brands.

[Features](#-key-capabilities) • [Architecture](#-system-architecture) • [AI Agent Team](#-specialized-ai-agent-team) • [Quick Start](#-quick-start) • [Environment Variables](#-environment-variables) • [Security](#-security--privacy)

</div>

---

## 🌟 Overview

**GrowthOS** replaces disjointed scripts, disparate marketing tools, and manual agency workflows with a unified, autonomous operating system. Powered by Google Gemini and state-of-the-art LLMs, GrowthOS crawls any target business URL, synthesizes an evolving **Company Brain**, formulates a data-driven 90-day growth strategy, and coordinates a team of specialized AI agents to autonomously draft content, audit technical SEO, engage on community forums, generate backlinks, score leads, and publish across social channels.

```
       [ Client Website URL ] 
                 │
                 ▼
     ┌───────────────────────┐
     │   Website Analyzer    │  ── Crawls DOM, extracts copy, meta tags & tech stack
     └───────────────────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │     Company Brain     │  ── Vector embeddings, brand voice, ICP & positioning
     └───────────────────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │ AI Orchestration Loop │  ── 24/7 Autonomous execution, task dispatch & monitoring
     └───────────────────────┘
                 │
  ┌──────────────┼──────────────┬──────────────┬──────────────┐
  ▼              ▼              ▼              ▼              ▼
[ SEO ]     [ Content ]     [ Social ]    [ Community ]   [ Leads ]
Specialist   Specialist     Distribution   Smart Replies  Discovery
```

---

## ✨ Key Capabilities

### 1. 🌐 Zero-Config Autonomous Onboarding
- Input any company website URL (`https://yourcompany.com`).
- Live SSE (Server-Sent Events) pipeline automatically crawls domain pages, extracts core offerings, defines target personas, and synthesizes brand tone.
- Bootstraps the **Company Brain** and builds a tailored 30-day content calendar within seconds.

### 2. 🧠 Unified Company Brain
- Centralized knowledge vault containing value propositions, competitive intelligence, brand voice guidelines, product catalogues, and target audience segments.
- Semantic vector search grounds all agent executions to guarantee hallucination-free, on-brand output.

### 3. 🛡️ Autonomous Execution with Governance Controls
- Configurable autonomy levels:
  - **Level 1 (Manual):** AI generates suggestions; humans approve every single action.
  - **Level 2 (Copilot):** Automated drafts with single-click human reviews.
  - **Level 3 (Supervised Autonomous):** Deterministic execution with safety bounds and budget thresholds.
  - **Level 4 (Full Autonomy):** Continuous 24/7 self-directed marketing loop with automated reporting.

### 4. 🔌 Secure Multi-Channel Connectors
- Connect Twitter / X, LinkedIn, TikTok, Instagram, Reddit, GitHub, Slack, and Webhooks.
- Multi-tenant credential isolation encrypted at rest using **AES-256-GCM**.

### 5. 📊 Real-Time Analytics & Attribution
- Track impressions, engagements, clicks, SERP ranking positions, and organic search gains across campaigns.
- Automated feedback loop optimizes agent prompts and strategies based on empirical engagement metrics.

---

## 🤖 Specialized AI Agent Team

| Agent | Core Responsibilities | Key Outputs |
|---|---|---|
| **Lead / Orchestrator Agent** | Mission planning, resource dispatch, conflict resolution, execution monitoring | 90-day growth roadmap, task priority queue |
| **SEO Specialist Agent** | Technical SEO audits, SERP gap analysis, keyword discovery, sitemap audits | Actionable audit reports, keyword difficulty matrices |
| **Content & Copywriting Agent** | Multi-format content generation (Technical teardowns, viral Twitter/X threads, blogs, newsletters) | Multi-platform draft queue, ready-to-publish media |
| **Social & Distribution Agent** | Scheduling, formatting, media attachment, publishing across LinkedIn, Twitter, TikTok, Instagram | Live posts, engagement tracking, automated scheduling |
| **Community & Outreach Agent** | Discovery of relevant discussions (Reddit, Quora, IndieHackers), context-aware smart replies, natural backlink placement | Community responses, reputation monitoring |
| **Lead Intelligence Agent** | ICP matching, contact enrichment, prospect qualification, outbound messaging | Scored lead lists, personalized email sequences |

---

## 🏗️ System Architecture & Monorepo Layout

GrowthOS is engineered as a high-performance TypeScript monorepo driven by **Turborepo** and **pnpm**:

```
NOEVRA / GrowthOS
├── apps/
│   ├── web/                     # Next.js 15 App Router Frontend (Glassmorphic UI)
│   ├── api/                     # NestJS 10 REST & SSE Core API
│   └── worker/                  # BullMQ Background Job Worker
├── packages/
│   ├── agent-runtime/           # Agent loop, task execution, tool dispatch
│   ├── agent-sdk/               # Agent definitions, prompt templates & roles
│   ├── ai/                      # Multi-provider model router (Gemini, OpenAI, Anthropic)
│   ├── config/                  # Shared Zod-validated environment config
│   ├── connectors/              # Social media & third-party platform integrations
│   ├── database/                # Prisma ORM schema, client & PostgreSQL migrations
│   ├── events/                  # Typed event emitter & message contracts
│   ├── memory/                  # Vector memory store & semantic retriever
│   ├── policy-engine/           # Autonomy tier enforcement & budget constraints
│   ├── shared/                  # Utilities, types, crypto & SSRF safe-url guards
│   └── tools/                   # Built-in agent tools (Web scraper, SERP, SEO audit)
└── docs/                        # Comprehensive architectural specifications & ADRs
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **pnpm**: v9.x (`npm install -g pnpm`)
- **PostgreSQL**: v15+ (or local PostgreSQL 18 service)
- **Redis**: v7+ (optional for local dev; graceful timeout fallbacks included)

---

### Step 1: Clone the Repository
```bash
git clone <YOUR_REPO_URL>
cd NOEVRA
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Configure Environment Variables
Copy the template configuration:
```bash
cp .env.example .env
```
Edit `.env` and supply your database connection and API keys:
```ini
# Core Configuration
PORT=3001
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# PostgreSQL Database
DATABASE_URL="postgresql://growthos:growthos_dev@127.0.0.1:5432/growthos_dev?schema=public"

# Redis (BullMQ queues)
REDIS_URL="redis://localhost:6379"

# Authentication & Cryptography
JWT_SECRET="generate-a-secure-random-secret-key-at-least-64-characters-long"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# AI Provider Keys
GOOGLE_AI_API_KEY="your-gemini-api-key"
AI_DEFAULT_PROVIDER="google"
AI_DEFAULT_MODEL="google/gemini-2.5-flash"
```

### Step 4: Run Database Migrations
```bash
pnpm --filter @growthos/database migrate:dev
```

### Step 5: Start Development Servers
```bash
# Launch both Next.js Web (port 3000) and NestJS API (port 3001) concurrently
pnpm dev
```

Your applications will be live at:
- 🌐 **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
- 🔧 **REST API:** [http://localhost:3001](http://localhost:3001)
- 📚 **Swagger Documentation:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 🧪 Testing & Quality Assurance

```bash
# Run unit and integration test suites
pnpm test

# Run tests with code coverage report
pnpm test:cov

# Typecheck all monorepo packages
pnpm build
```

---

## 🔐 Security & Privacy

GrowthOS is built from the ground up for strict enterprise security:
- **SSRF Defense**: All outbound crawling URLs are validated against private IP ranges (`10.0.0.0/8`, `127.0.0.0/8`, `192.168.0.0/16`, AWS metadata `169.254.169.254`, IPv6 loopbacks) via `safeUrl()`.
- **Zero Secret Commits**: All credentials and sensitive API tokens live strictly inside local `.env` files which are tracked by `.gitignore`.
- **Tenant Isolation**: Every database query is scoped by `organizationId`. Cross-tenant data leakage is structurally prevented at the Prisma repository layer.
- **Encrypted Credential Vault**: Third-party OAuth tokens (LinkedIn, Twitter, TikTok) are encrypted at rest with authenticated AES-256-GCM.

---

## 📋 Available Dashboard Routes

| Route | Functionality |
|---|---|
| `/onboarding` | 1-Click Autonomous Website Analysis & Strategy Generator |
| `/autonomous` | 24/7 Autonomous Operations Control Center & Agent Logs |
| `/agents` | Agent Team Directory, Health Status & Execution Traces |
| `/brain` | Company Brain Knowledge Base & Semantic Search Explorer |
| `/content` | Multi-Format Content Queue & Review Pipeline |
| `/seo` | Technical SEO Audits & Keyword Opportunity Tracking |
| `/leads` | Lead Discovery, Enrichment & ICP Scoring Board |
| `/connectors` | Social & Community Channel Integrations |
| `/analytics` | Real-time Engagement, Attribution & ROI Dashboard |

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
